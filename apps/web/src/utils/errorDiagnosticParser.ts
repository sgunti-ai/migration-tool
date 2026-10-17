export type ErrorCategory =
  | 'LICENSING'
  | 'THROTTLING'
  | 'NAMESPACE'
  | 'AUTH'
  | 'SIZE_LIMIT'
  | 'INFRASTRUCTURE'
  | 'IDENTITY'
  | 'INTEGRITY'
  | 'UNKNOWN';

export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';

export interface RemediationStep {
  stepNumber: number;
  instruction: string;
  detail: string;
  actionType?: 'PORTAL' | 'POWERSHELL' | 'SETTINGS' | 'WAIT';
}

export interface ParsedErrorDiagnostic {
  errorCode: string;
  statusCode?: number;
  category: ErrorCategory;
  categoryLabel: string;
  severity: ErrorSeverity;
  title: string;
  summary: string;
  rootCause: string;
  whyRetryFailed: string;
  remediationSteps: RemediationStep[];
  powershellCmdlet?: string;
  graphEndpoint?: string;
  docUrl: string;
  docTitle: string;
  checkpointSummary?: {
    stage: string;
    description: string;
    dataPreserved: string;
    resumptionStrategy: string;
  };
  recommendedAction: string;
  quickFixAvailable: boolean;
  quickFixLabel?: string;
  quickFixType?: 'ALLOCATE_LICENSE' | 'APPLY_BACKOFF' | 'TRUNCATE_PATH' | 'REFRESH_TOKEN' | 'INCREASE_SIZE' | 'REMAP_IDENTITY';
}

/**
 * Parses raw error messages, status codes, and checkpoint stages from Microsoft 365 migration pipelines
 * into human-readable diagnostic analysis and actionable remediation steps.
 */
export function parseErrorDiagnostic(
  errorMessage: string | null | undefined,
  activeStep?: string | null,
  checkpointStage?: string | null,
  targetUPN?: string,
  sourceUPN?: string
): ParsedErrorDiagnostic {
  const msg = (errorMessage || activeStep || '').toLowerCase();
  const rawMsg = errorMessage || activeStep || 'Unspecified streaming transfer interruption';
  const targetUser = targetUPN || 'user@targettenant.com';
  const sourceUser = sourceUPN || 'user@sourcetenant.onmicrosoft.com';

  // 1. GRAPH 403 / LICENSING & MAILBOX PROVISIONING QUOTA
  if (
    msg.includes('403') ||
    msg.includes('license') ||
    msg.includes('licensing') ||
    msg.includes('quota') ||
    msg.includes('provisioning quota') ||
    msg.includes('enterprise license pool')
  ) {
    return {
      errorCode: 'GRAPH_403_LICENSE_QUOTA',
      statusCode: 403,
      category: 'LICENSING',
      categoryLabel: 'Licensing & Target Quota',
      severity: 'CRITICAL',
      title: 'Target Mailbox Provisioning Quota Exceeded',
      summary: 'Target tenant lacks an available Exchange Online or Microsoft 365 licensing SKU to provision the recipient mailbox.',
      rootCause:
        'The migration orchestrator called Microsoft Graph / Exchange REST to provision the target user mailbox container, but the target tenant license pool has zero unassigned Exchange Online Plan 1/2 or Microsoft 365 E3/E5 seats available.',
      whyRetryFailed:
        'Retrying immediately fails because license assignment is an external dependency in Entra ID / M365 Admin Center. Without an allocated seat, Microsoft 365 will reject all subsequent provisioning requests with HTTP 403 Forbidden.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Allocate additional licensing seats or reassign unutilized licenses in target tenant',
          detail: 'Open Microsoft 365 Admin Center (admin.microsoft.com) -> Billing -> Licenses. Ensure Exchange Online Plan 2 or M365 E5 has at least 1 available license.',
          actionType: 'PORTAL',
        },
        {
          stepNumber: 2,
          instruction: 'Assign the license to the target identity UPN',
          detail: `Run Set-MgUserLicense or assign directly to ${targetUser} in Entra ID admin center.`,
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 3,
          instruction: 'Verify target mailbox state is Active (UserMailbox)',
          detail: 'Confirm Get-Mailbox returns recipientTypeDetails: UserMailbox and ExchangeGuid is populated.',
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 4,
          instruction: 'Trigger Resumable Retry in Cockpit',
          detail: 'Click "Retry User Migration". The engine will resume directly from the pre-flight checkpoint without data loss.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# 1. Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All", "Organization.Read.All"

# 2. Check available license SKUs
Get-MgSubscribedSku | Select-Object SkuPartNumber, SkuId, @{N='Available';E={$_.PrepaidUnits.Enabled - $_.ConsumedUnits}}

# 3. Assign Exchange Online / M365 License to Target Identity
Set-MgUserLicense -UserId "${targetUser}" -AddLicenses @{SkuId = "6fd2c87f-b296-42f0-b197-1e91e994b900"} -RemoveLicenses @()`,
      graphEndpoint: 'POST https://graph.microsoft.com/v1.0/users/{id}/assignLicense',
      docUrl: 'https://learn.microsoft.com/en-us/microsoft-365/admin/manage/assign-licenses-to-users',
      docTitle: 'Microsoft 365 Learn: Assign Licenses to Users',
      checkpointSummary: {
        stage: checkpointStage || 'MAILBOX_PREFLIGHT',
        description: 'Failed during mailbox preflight validation and container verification.',
        dataPreserved: '0 MB transferred so far; credentials and mapping definitions are safely preserved.',
        resumptionStrategy: 'Once licensed, the orchestrator begins direct chunk streaming immediately.',
      },
      recommendedAction: 'Add available Exchange Online license to target user in M365 Admin Center, then click Retry.',
      quickFixAvailable: true,
      quickFixLabel: 'Simulate License Pool Assignment',
      quickFixType: 'ALLOCATE_LICENSE',
    };
  }

  // 2. GRAPH 429 / API THROTTLING & RATE-LIMIT
  if (
    msg.includes('429') ||
    msg.includes('throttl') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('retry-after') ||
    msg.includes('timed out after 3 retries')
  ) {
    return {
      errorCode: 'GRAPH_429_THROTTLING_LIMIT',
      statusCode: 429,
      category: 'THROTTLING',
      categoryLabel: 'API Rate Limiting & Backoff',
      severity: 'HIGH',
      title: 'Microsoft Graph / EWS API Throughput Rate Limit Exceeded',
      summary: 'Microsoft 365 tenant-wide API consumption quota was exceeded. Request was blocked by Microsoft rate limiters.',
      rootCause:
        'The streaming pipeline reached Microsoft 365 application-level throttling thresholds (typically 10,000 requests per 10 minutes per app ID or 20 concurrent mailbox sessions). Microsoft returned HTTP 429 with Retry-After header.',
      whyRetryFailed:
        'A quick retry executed before the Retry-After cooldown window has elapsed will be immediately dropped by Microsoft front-door load balancers. Concurrency must be reduced or backoff cooldown honored before retrying.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Wait for the mandatory sliding-window backoff cooldown (60–120 seconds)',
          detail: 'Allow the Microsoft 365 token bucket to replenish before resuming traffic streams.',
          actionType: 'WAIT',
        },
        {
          stepNumber: 2,
          instruction: 'Decrease parallel worker concurrency in Job Settings',
          detail: 'Lower direct stream parallel threads from 10 to 4 to spread API calls across time.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 3,
          instruction: 'Request Microsoft Migration Throughput Elasticity Boost',
          detail: 'In M365 Admin Center -> Need Help? -> Run Diagnostics for "EWS Throttling" and request a 30-day temporary throughput increase.',
          actionType: 'PORTAL',
        },
        {
          stepNumber: 4,
          instruction: 'Execute Resumable Checkpoint Retry',
          detail: 'Resume direct streaming; memory buffer will pick up from the exact saved chunk with zero re-transfer of previous chunks.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Inspect organization EWS and Graph concurrency thresholds
Connect-ExchangeOnline
Get-OrganizationConfig | Select-Object -Property EwsMaxConcurrency, EwsMaxBurst, EwsCutoffBalance

# Check Exchange Web Services throttling policy
Get-ThrottlingPolicy | Where-Object {$_.IsDefault -eq $true} | Format-List`,
      graphEndpoint: 'HTTP 429 Too Many Requests [Retry-After: 60]',
      docUrl: 'https://learn.microsoft.com/en-us/graph/throttling',
      docTitle: 'Microsoft Graph Throttling Guidance & Best Practices',
      checkpointSummary: {
        stage: checkpointStage || 'MAILBOX_CHUNK_3',
        description: `Throttled at stage ${checkpointStage || 'STREAM_TRANSFER'}.`,
        dataPreserved: 'All previous chunks already transferred to target are confirmed and intact.',
        resumptionStrategy: 'Will resume direct chunk streaming from next pending chunk index.',
      },
      recommendedAction: 'Wait 60s for cooldown, then click Retry with checkpoint resumption.',
      quickFixAvailable: true,
      quickFixLabel: 'Apply 60s Backoff & Concurrency Throttle',
      quickFixType: 'APPLY_BACKOFF',
    };
  }

  // 3. GRAPH / SPO 409 / FOLDER HIERARCHY & PATH LENGTH CONSTRAINT (>400 CHARS)
  if (
    msg.includes('409') ||
    msg.includes('folder hierarchy') ||
    msg.includes('path length') ||
    msg.includes('400 char') ||
    msg.includes('name collision') ||
    msg.includes('path too long') ||
    msg.includes('illegal character') ||
    msg.includes('constraint')
  ) {
    return {
      errorCode: 'SPO_409_FOLDER_HIERARCHY',
      statusCode: 409,
      category: 'NAMESPACE',
      categoryLabel: 'Path Length & Folder Hierarchy',
      severity: 'HIGH',
      title: 'SharePoint / OneDrive Path Depth or Character Limit Constraint',
      summary: 'File or folder hierarchy exceeds SharePoint Online 400-character URL limit or contains disallowed characters.',
      rootCause:
        'SharePoint Online and OneDrive for Business enforce a maximum decoded path length of 400 characters (including tenant domain and site collection URL). Deep nested folder trees or names with characters like \\ / : * ? " < > | trigger HTTP 409 Conflict.',
      whyRetryFailed:
        'Retrying without modifying the folder structure or enabling automated path normalization fails predictably because the target file system rejects paths over 400 characters on every attempt.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Enable Automated Path Normalization & Name Sanitization',
          detail: 'Enable "Auto-Truncate Paths (>260 chars)" in workload migration pipeline settings to flatten deep subdirectories.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 2,
          instruction: 'Sanitize reserved characters in source metadata',
          detail: 'Replace disallowed characters (#, %, &, {, }, \\, :, <, >, ?, /, |, *) with standard underscores.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 3,
          instruction: 'Remap target library root to shorter path',
          detail: `Remap personal site URL or document library to a concise namespace for ${targetUser}.`,
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 4,
          instruction: 'Resume Checkpoint Migration',
          detail: 'Trigger retry. Unaffected files and previously migrated documents will be skipped.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Identify files with path length > 300 characters in user OneDrive
Connect-PnPOnline -Url "https://contoso-my.sharepoint.com/personal/${sourceUser.replace(/[@.]/g, '_')}" -Interactive
Get-PnPListItem -List "Documents" -PageSize 500 | Where-Object { $_["FileRef"].Length -gt 300 } | Select-Object -Property @{N="PathLength";E={$_.FieldValues.FileRef.Length}}, @{N="Path";E={$_.FieldValues.FileRef}}`,
      graphEndpoint: 'POST https://graph.microsoft.com/v1.0/drives/{drive-id}/root/children',
      docUrl: 'https://learn.microsoft.com/en-us/sharepoint/troubleshoot/lists-and-libraries/file-name-size-type-restrictions',
      docTitle: 'Restrictions and Limitations in OneDrive and SharePoint',
      checkpointSummary: {
        stage: checkpointStage || 'ONEDRIVE_CHUNK_4',
        description: 'Failed during OneDrive / SharePoint folder hierarchy synchronization.',
        dataPreserved: 'All valid files uploaded before this path collision remain safely stored.',
        resumptionStrategy: 'Path truncation filter applied; retry transfers remaining sanitized documents.',
      },
      recommendedAction: 'Enable Automated Path Truncation rule and retry the affected documents.',
      quickFixAvailable: true,
      quickFixLabel: 'Auto-Truncate Deep Paths & Retry',
      quickFixType: 'TRUNCATE_PATH',
    };
  }

  // 4. MSAL / ENTRA ID 401 / TOKEN EXPIRATION & CONSENT
  if (
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('token') ||
    msg.includes('expired') ||
    msg.includes('aadsts') ||
    msg.includes('consent') ||
    msg.includes('msal')
  ) {
    return {
      errorCode: 'ENTRA_401_TOKEN_EXPIRED',
      statusCode: 401,
      category: 'AUTH',
      categoryLabel: 'Authentication & Tenant Consent',
      severity: 'CRITICAL',
      title: 'Entra ID OAuth2 Access / Refresh Token Expired',
      summary: 'The Microsoft Identity platform access token expired during background execution and could not be silently refreshed.',
      rootCause:
        'Continuous Access Evaluation (CAE) or token lifetime policies invalidated the app credential. Either the client secret expired, admin consent was altered, or a conditional access policy triggered MFA re-challenge.',
      whyRetryFailed:
        'Retries will continue failing with HTTP 401 Unauthorized until new OAuth tokens are acquired via Admin Consent callback.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Re-authenticate Source & Target Tenants via MSAL Admin Consent',
          detail: 'Navigate to Multi-Tenant Connections in Cockpit and click "Grant Admin Consent" for both tenants.',
          actionType: 'PORTAL',
        },
        {
          stepNumber: 2,
          instruction: 'Verify Application Permissions in Entra ID Portal',
          detail: 'Check that Mail.ReadWrite, Files.ReadWrite.All, and Directory.ReadWrite.All show "Granted for <Organization>".',
          actionType: 'PORTAL',
        },
        {
          stepNumber: 3,
          instruction: 'Validate Client Secret Expiration Date',
          detail: 'Ensure the client secret has not reached its expiration date in Entra App Registrations.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 4,
          instruction: 'Trigger Resumable Retry',
          detail: 'With fresh bearer tokens in memory, retries will proceed instantly from the last checkpoint.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Reconnect to Microsoft Graph with required migration application scopes
Connect-MgGraph -TenantId "contoso.onmicrosoft.com" -Scopes "Mail.ReadWrite", "Files.ReadWrite.All", "User.ReadWrite.All", "Directory.ReadWrite.All"

# Verify current token expiration and permissions
Get-MgContext | Select-Object ClientId, TenantId, Scopes, AuthType`,
      graphEndpoint: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
      docUrl: 'https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow',
      docTitle: 'Microsoft Entra ID OAuth 2.0 Authorization Flow',
      checkpointSummary: {
        stage: checkpointStage || 'AUTH_TOKEN_VALIDATION',
        description: 'Interrupted due to expired bearer authentication token.',
        dataPreserved: 'All transferred data remains in target tenant; pipeline state is intact.',
        resumptionStrategy: 'Immediate seamless resumption upon token refresh.',
      },
      recommendedAction: 'Re-authenticate tenant connection in Admin Consent tab, then click Retry.',
      quickFixAvailable: true,
      quickFixLabel: 'Refresh OAuth Tokens & Retry',
      quickFixType: 'REFRESH_TOKEN',
    };
  }

  // 5. HTTP 413 / MESSAGE SIZE & ATTACHMENT LIMIT EXCEEDED (>35MB)
  if (
    msg.includes('413') ||
    msg.includes('payload too large') ||
    msg.includes('message size') ||
    msg.includes('attachment') ||
    msg.includes('size limit') ||
    msg.includes('item exceeds')
  ) {
    return {
      errorCode: 'EXO_413_MAX_SIZE_LIMIT',
      statusCode: 413,
      category: 'SIZE_LIMIT',
      categoryLabel: 'Message & Attachment Size Limits',
      severity: 'MEDIUM',
      title: 'Item Exceeds Target Organization Message Size Limit (35MB)',
      summary: 'A message or attachment in the source mailbox exceeds the target tenant transport configuration receive limit.',
      rootCause:
        'Exchange Online applies a default 35MB maximum receive message limit. The source mailbox contains an item larger than 35MB (e.g., 42.8 MB email with high-res PDFs). The target transport service rejected the MIME payload with HTTP 413.',
      whyRetryFailed:
        'Retrying without increasing target receive limits or configuring large-item attachment detachment will fail every time the orchestrator encounters this message.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Increase Target Tenant Organization Max Receive Size to 150MB',
          detail: 'Run Set-TransportConfig -MaxReceiveSize 150MB in Exchange Online PowerShell.',
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 2,
          instruction: 'Increase individual mailbox receive quotas',
          detail: `Run Set-Mailbox "${targetUser}" -MaxReceiveSize 150MB.`,
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 3,
          instruction: 'Enable Large-Item OneDrive Attachment Conversion',
          detail: 'Optionally configure large attachments to be automatically detached and uploaded to user OneDrive with sharing link.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 4,
          instruction: 'Resume direct streaming retry',
          detail: 'Retry user migration; the engine skips already migrated items and successfully deposits the large message.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Connect to Exchange Online
Connect-ExchangeOnline

# 1. Update Organization-wide transport limits
Set-TransportConfig -MaxReceiveSize 150MB -MaxSendSize 150MB

# 2. Update specific target mailbox receive limits
Set-Mailbox -Identity "${targetUser}" -MaxReceiveSize 150MB -MaxSendSize 150MB

# 3. Verify updated receive limits
Get-Mailbox -Identity "${targetUser}" | Select-Object DisplayName, MaxReceiveSize, MaxSendSize`,
      graphEndpoint: 'POST https://graph.microsoft.com/v1.0/users/{id}/messages',
      docUrl: 'https://learn.microsoft.com/en-us/office365/servicedescriptions/exchange-online-service-description/exchange-online-limits#message-limits',
      docTitle: 'Exchange Online Limits: Message Size Limits',
      checkpointSummary: {
        stage: checkpointStage || 'MAILBOX_CHUNK_5',
        description: 'Paused on oversized message item in Inbox/Sent items folder.',
        dataPreserved: 'All previous messages and folders up to this point are stored and verified.',
        resumptionStrategy: 'Will resume directly from oversized item once limits are increased.',
      },
      recommendedAction: 'Increase Exchange Online receive limits to 150MB, then click Retry.',
      quickFixAvailable: true,
      quickFixLabel: 'Increase Limit to 150MB & Retry',
      quickFixType: 'INCREASE_SIZE',
    };
  }

  // 6. HTTP 503 / 502 / 504 / SERVICE UNAVAILABLE / EXCHANGE DATABASE FAILOVER
  if (
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('service unavailable') ||
    msg.includes('failover') ||
    msg.includes('timeout') ||
    msg.includes('connection reset') ||
    msg.includes('endpoint unavailable')
  ) {
    return {
      errorCode: 'EXO_503_SERVICE_UNAVAILABLE',
      statusCode: 503,
      category: 'INFRASTRUCTURE',
      categoryLabel: 'Target Infrastructure Health',
      severity: 'HIGH',
      title: 'Exchange Online Service Unavailable (Mailbox Database Failover)',
      summary: 'Microsoft 365 cloud infrastructure actively undergoing transient database failover or maintenance.',
      rootCause:
        'The target Exchange Online mailbox database experienced a replica switchover or transient RPC endpoint timeout within the Microsoft datacenter. The service returned HTTP 503 Service Unavailable.',
      whyRetryFailed:
        'Immediate retries before the database copy completes mounting on the target active server will fail with connection drop.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Check Microsoft 365 Service Health Dashboard',
          detail: 'Verify admin.microsoft.com -> Health -> Service health for active Exchange Online incident advisories (e.g. EX892102).',
          actionType: 'PORTAL',
        },
        {
          stepNumber: 2,
          instruction: 'Wait 3–5 minutes for mailbox database replica stabilization',
          detail: 'Database active copy switchover in Exchange Online typically stabilizes within 180 seconds.',
          actionType: 'WAIT',
        },
        {
          stepNumber: 3,
          instruction: 'Test target mailbox connectivity with Test-MapiConnectivity',
          detail: `Run Test-MapiConnectivity -Identity "${targetUser}" in Exchange Online PowerShell.`,
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 4,
          instruction: 'Resume Checkpoint Migration',
          detail: 'Retry the user. The direct chunked memory stream will reconnect and resume without data duplication.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Test mailbox availability and database health
Connect-ExchangeOnline
Test-MapiConnectivity -Identity "${targetUser}"
Get-MailboxStatistics -Identity "${targetUser}" | Select-Object DisplayName, ItemCount, TotalItemSize, DatabaseName`,
      graphEndpoint: 'https://outlook.office365.com/api/v2.0/me/messages',
      docUrl: 'https://learn.microsoft.com/en-us/exchange/troubleshoot/administration/transient-errors-migration',
      docTitle: 'Exchange Online Troubleshooting: Transient Database Errors',
      checkpointSummary: {
        stage: checkpointStage || 'MAILBOX_DELTA_SYNC',
        description: 'Temporarily paused due to remote database switchover.',
        dataPreserved: '100% of previously transferred chunks are safe in target database.',
        resumptionStrategy: 'Direct reconnect to newly mounted database copy.',
      },
      recommendedAction: 'Wait 3 minutes for Microsoft database mount stabilization, then click Retry.',
      quickFixAvailable: true,
      quickFixLabel: 'Wait Cooldown & Re-test Database',
      quickFixType: 'APPLY_BACKOFF',
    };
  }

  // 7. HTTP 404 / TARGET IDENTITY OBJECT NOT FOUND IN ENTRA ID
  if (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('identity') ||
    msg.includes('user not found') ||
    msg.includes('does not exist') ||
    msg.includes('sourceanchor') ||
    msg.includes('immutableid')
  ) {
    return {
      errorCode: 'ENTRA_404_IDENTITY_MISSING',
      statusCode: 404,
      category: 'IDENTITY',
      categoryLabel: 'Directory Synchronization & Staging',
      severity: 'CRITICAL',
      title: 'Target Cloud Identity Object Missing in Entra ID',
      summary: 'The target recipient account does not exist in the destination Microsoft Entra ID tenant.',
      rootCause:
        `The migration engine attempted to write mailbox/OneDrive data for ${targetUser}, but Entra ID returned HTTP 404 Not Found. Identity synchronization (Entra ID Connect / Cloud Sync) or user staging has not yet created this user object.`,
      whyRetryFailed:
        'Retries fail immediately because data cannot be streamed into a non-existent cloud user principal.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Provision Target Identity via Entra ID Connect or CSV Mapping Engine',
          detail: 'Run Delta Sync in Entra ID Connect or use the CSV Mapping Engine in this console to pre-stage the user.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 2,
          instruction: 'Verify SourceAnchor / ImmutableId consistency',
          detail: 'Ensure Base64 ObjectGUID from source matches ImmutableId on target user object.',
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 3,
          instruction: 'Confirm primary SMTP domain is an Accepted Domain',
          detail: 'Verify the domain suffix of the target UPN is verified and marked as Accepted Domain in target tenant.',
          actionType: 'PORTAL',
        },
        {
          stepNumber: 4,
          instruction: 'Retry User Migration in Cockpit',
          detail: 'Once the account is visible in target directory, retry execution to begin data copy.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Verify user existence in target tenant
Connect-MgGraph -Scopes "User.Read.All"
Get-MgUser -UserId "${targetUser}" | Select-Object DisplayName, UserPrincipalName, Id, Mail, AccountEnabled

# If missing, create target staging user
New-MgUser -DisplayName "${targetUser.split('@')[0]}" -UserPrincipalName "${targetUser}" -MailNickname "${targetUser.split('@')[0]}" -AccountEnabled -PasswordProfile @{Password = "Welcome2026!"}`,
      graphEndpoint: 'GET https://graph.microsoft.com/v1.0/users/{id}',
      docUrl: 'https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/whatis-hybrid-identity',
      docTitle: 'Microsoft Entra ID: Hybrid Identity & User Provisioning',
      checkpointSummary: {
        stage: checkpointStage || 'IDENTITY_PROVISIONING',
        description: 'Failed before data transfer because target user object was not found.',
        dataPreserved: 'Source data completely intact. Mapping definition saved.',
        resumptionStrategy: 'Will initiate complete direct streaming upon account discovery.',
      },
      recommendedAction: 'Provision user in target Entra ID or run CSV Mapping Engine, then click Retry.',
      quickFixAvailable: true,
      quickFixLabel: 'Provision Target Identity & Retry',
      quickFixType: 'REMAP_IDENTITY',
    };
  }

  // 8. DATA INTEGRITY / CHECKSUM MISMATCH
  if (
    msg.includes('checksum') ||
    msg.includes('hash mismatch') ||
    msg.includes('corrupt') ||
    msg.includes('crc') ||
    msg.includes('sha256')
  ) {
    return {
      errorCode: 'INTEGRITY_CHECKSUM_MISMATCH',
      statusCode: 422,
      category: 'INTEGRITY',
      categoryLabel: 'Data Integrity & Checksum Verification',
      severity: 'HIGH',
      title: 'Payload Checksum Mismatch During Direct Memory Stream',
      summary: 'Target payload SHA-256 hash does not match source stream hash. Chunk aborted to prevent corruption.',
      rootCause:
        'The streaming chunk was received by the target endpoint with byte variance due to packet drop or transient memory corruption. Zero-data-loss integrity guard blocked chunk commit.',
      whyRetryFailed:
        'Automatic single retry may succeed, but if the source item is corrupt on source disk, it will repeatedly fail validation.',
      remediationSteps: [
        {
          stepNumber: 1,
          instruction: 'Verify source item integrity in source mailbox/drive',
          detail: `Run integrity check on source item for ${sourceUser}.`,
          actionType: 'POWERSHELL',
        },
        {
          stepNumber: 2,
          instruction: 'Flush memory chunk buffer and request fresh binary stream',
          detail: 'The engine will discard corrupt buffer chunk and request fresh stream from source REST endpoint.',
          actionType: 'SETTINGS',
        },
        {
          stepNumber: 3,
          instruction: 'Click Resumable Retry in Cockpit',
          detail: 'Orchestrator re-reads the specific chunk with high-fidelity double verification.',
          actionType: 'SETTINGS',
        },
      ],
      powershellCmdlet: `# Verify mailbox folder corruption count
Connect-ExchangeOnline
Get-MailboxRepairRequest -Mailbox "${sourceUser}"`,
      graphEndpoint: 'https://graph.microsoft.com/v1.0/drives/{id}/items/{id}/content',
      docUrl: 'https://learn.microsoft.com/en-us/sharepoint/dev/apis/large-file-upload',
      docTitle: 'Microsoft Graph: Upload Large Files & Integrity Checks',
      checkpointSummary: {
        stage: checkpointStage || 'CHECKSUM_VALIDATION',
        description: 'Blocked commit of unverified chunk to guarantee zero data loss.',
        dataPreserved: 'All verified chunks prior to this file are committed and intact.',
        resumptionStrategy: 'Re-transfers only the unverified chunk with fresh source checksum.',
      },
      recommendedAction: 'Flush buffer and re-stream chunk with fresh integrity verification.',
      quickFixAvailable: true,
      quickFixLabel: 'Re-stream Clean Chunk & Verify',
    };
  }

  // 9. GENERAL / UNKNOWN PARSER FALLBACK
  return {
    errorCode: 'GENERIC_PIPELINE_ERROR',
    category: 'UNKNOWN',
    categoryLabel: 'Pipeline Execution Diagnostics',
    severity: 'MEDIUM',
    title: 'Streaming Pipeline Interruption',
    summary: rawMsg,
    rootCause: `The migration transfer encountered an execution interruption during stage [${checkpointStage || 'STREAMING'}]: ${rawMsg}`,
    whyRetryFailed:
      'The underlying constraint preventing transfer has not been addressed, or transient network connectivity to the target tenant was interrupted.',
    remediationSteps: [
      {
        stepNumber: 1,
        instruction: 'Inspect active stage checkpoint and tenant endpoints',
        detail: `Examine checkpoint stage [${checkpointStage || 'UNKNOWN'}]. Ensure source (${sourceUser}) and target (${targetUser}) endpoints are reachable.`,
        actionType: 'SETTINGS',
      },
      {
        stepNumber: 2,
        instruction: 'Review tenant audit logs and security events',
        detail: 'Check Entra ID sign-in logs for conditional access blocks or IP address filtering.',
        actionType: 'PORTAL',
      },
      {
        stepNumber: 3,
        instruction: 'Trigger Resumable Batch Retry',
        detail: 'The orchestrator will re-attempt stream connection from the preserved checkpoint.',
        actionType: 'SETTINGS',
      },
    ],
    powershellCmdlet: `# Test tenant connectivity and authentication status
Connect-MgGraph -Scopes "User.Read.All"
Get-MgContext`,
    graphEndpoint: 'https://graph.microsoft.com/v1.0/',
    docUrl: 'https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-migration-overview',
    docTitle: 'Microsoft 365 Migration Overview & Troubleshooting Guide',
    checkpointSummary: {
      stage: checkpointStage || 'STREAM_TRANSFER',
      description: `Preserved at checkpoint: ${checkpointStage || 'Direct Stream'}.`,
      dataPreserved: 'Transferred chunks remain in target tenant.',
      resumptionStrategy: 'Resumable execution from checkpoint stage.',
    },
    recommendedAction: 'Review error details, verify tenant connectivity, and retry.',
    quickFixAvailable: false,
  };
}
