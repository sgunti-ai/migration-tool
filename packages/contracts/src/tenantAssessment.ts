export interface WorkstreamAssessmentData {
  evaluatedAt: string;
  sourceTenant: {
    domain: string;
    displayName: string;
    tenantId: string;
    environment: string;
  };
  targetTenant: {
    domain: string;
    displayName: string;
  };
  summary: {
    totalWorkstreams: number;
    overallReadinessScore: number;
    readinessGrade: string;
    criticalBlockers: number;
    recommendedRemediations: number;
    totalRegisteredApps: number;
    totalIdentities: number;
    totalMailboxes: number;
    totalStorageVolumeGB: number;
  };
  workstreams: {
    identityAndDirectory: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        inventory: {
          title: string;
          totalUsers: number;
          activeUsers: number;
          disabledAccounts: number;
          externalB2BGuests: number;
          totalGroups: number;
          securityGroups: number;
          m365UnifiedGroups: number;
          mailEnabledSecurityGroups: number;
          distributionLists: number;
          totalContacts: number;
          mailContacts: number;
          partnerFederatedContacts: number;
        };
        upnAndSmtpPatterns: {
          title: string;
          primaryUpnDomain: string;
          recognizedUpnPatterns: Array<{ pattern: string; sample: string; count: number; percentage: number }>;
          recognizedSmtpPatterns: Array<{ pattern: string; sample: string; count: number; routingTarget: string }>;
          secondaryDomains: string[];
          legacyExchangeDNsCount: number;
        };
        licenseAssignments: {
          title: string;
          licensePools: Array<{ sku: string; friendlyName: string; totalAssigned: number; poolAvailable: number; costStatus: string }>;
          directAssignedLicenses: number;
          groupBasedAssignedLicenses: number;
        };
        dormantAccounts: {
          title: string;
          inactiveOver90Days: number;
          inactiveOver180Days: number;
          neverLoggedIn: number;
          estimatedReclaimableLicenses: number;
          sampleDormantUsers: Array<{ upn: string; displayName: string; department: string; lastLoginDaysAgo: number; assignedSku: string }>;
        };
        duplicateAccounts: {
          title: string;
          collidingUpnsOrAliases: number;
          matchingDisplayNamesDifferentDomains: number;
          conflictingProxyAddresses: number;
          items: Array<{ identifier: string; conflictType: string; sourceUpn: string; conflictingTarget: string; recommendation: string }>;
        };
      };
    };
    exchangeAndMail: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        mailboxCounts: {
          title: string;
          totalMailboxes: number;
          userMailboxes: number;
          sharedMailboxes: number;
          roomMailboxes: number;
          equipmentMailboxes: number;
          discoverySystemMailboxes: number;
        };
        mailboxSizeDistribution: {
          title: string;
          under5GB: number;
          between5And25GB: number;
          between25And50GB: number;
          between50And100GB: number;
          over100GBAutoExpanding: number;
          totalMailboxVolumeGB: number;
          averageMailboxSizeGB: number;
        };
        archiveFootprint: {
          title: string;
          mailboxesWithArchiveEnabled: number;
          archiveAdoptionRate: string;
          totalArchiveSizeGB: number;
          autoExpandingArchivesActive: number;
          largestArchiveGB: number;
        };
        sharedRoomEquipment: {
          title: string;
          sharedMailboxesCount: number;
          resourceMailboxesCount: number;
          mailboxesWithFullAccessDelegation: number;
          mailboxesWithSendAsDelegation: number;
          sampleResources: Array<{ name: string; email: string; type: string; capacity?: number; bookingPolicy: string }>;
        };
        acceptedDomains: {
          title: string;
          domains: Array<{ domain: string; type: string; isDefault: boolean; mxRecordValid: boolean; spfDkimStatus: string }>;
        };
        transportRules: {
          title: string;
          totalRules: number;
          enabledRules: number;
          sampleRules: Array<{ name: string; priority: number; actionSummary: string; state: string }>;
          inboundConnectors: number;
          outboundConnectors: number;
        };
        retentionPolicies: {
          title: string;
          mrmPoliciesCount: number;
          retentionTagsActive: number;
          defaultActionSummary: string;
          policies: Array<{ name: string; tagCount: number; assignedMailboxes: number; defaultAction: string }>;
        };
        holds: {
          title: string;
          mailboxesOnLitigationHold: number;
          mailboxesOnEdiscoveryHold: number;
          mailboxesOnRetentionHold: number;
          totalDataPreservedOnHoldGB: number;
          holdCases: Array<{ caseName: string; holdType: string; custodianCount: number; createdAt: string }>;
        };
      };
    };
    oneDriveAndSharePoint: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        oneDriveAndSharePointInventory: {
          title: string;
          totalOneDriveAccounts: number;
          activeOneDrives: number;
          provisionedStorageGB: number;
          consumedStorageGB: number;
          totalSharePointSites: number;
          teamSitesCount: number;
          communicationSitesCount: number;
          hubSitesCount: number;
          sharePointStorageUsedGB: number;
        };
        permissionModels: {
          title: string;
          groupBackedSites: number;
          uniqueClassicPermissionSites: number;
          externalSharingBreakdown: {
            anyoneAnonymous: number;
            newAndExistingGuests: number;
            existingGuestsOnly: number;
            disabledInternalOnly: number;
          };
        };
        brokenInheritance: {
          title: string;
          librariesWithBrokenInheritance: number;
          foldersWithUniquePermissions: number;
          securityImpact: string;
          sampleSites: Array<{ siteUrl: string; brokenItemCount: number; primaryOwner: string }>;
        };
        pathsWithExcessiveLength: {
          title: string;
          pathsExceeding260Chars: number;
          pathsExceeding400Chars: number;
          actionRequired: string;
          samplePaths: Array<{ pathSnippet: string; characterLength: number; location: string }>;
        };
        pathsWithUnsupportedCharacters: {
          title: string;
          pathsWithIllegalCharsCount: number;
          unsupportedCharsFound: string[];
          sampleFlaggedFiles: Array<{ filename: string; illegalChar: string; location: string; proposedSanitizedName: string }>;
        };
      };
    };
    teamsAndCollaboration: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        teamsEnumeration: {
          title: string;
          totalTeams: number;
          standardChannels: number;
          privateChannels: number;
          sharedChannelsConnect: number;
          archivedTeams: number;
          sampleTeams: Array<{ name: string; visibility: string; channelsCount: number; membersCount: number; filesVolumeGB: number }>;
        };
        tabsWithinTeams: {
          title: string;
          totalTabsConfigured: number;
          nativeTabsCount: number;
          customWebsiteTabsCount: number;
          sharePointLibraryTabsCount: number;
          plannerBoardTabsCount: number;
        };
        thirdPartyApps: {
          title: string;
          integratedAppsCount: number;
          activeCustomBots: number;
          activeConnectors: number;
          topIntegratedApps: Array<{ appName: string; publisher: string; teamsInstalledIn: number; permissionsGranted: string }>;
        };
        teamsPolicies: {
          title: string;
          messagingPolicies: string[];
          meetingPolicies: string[];
          guestAccessStatus: string;
          chatRetentionPeriodDays: number;
        };
      };
    };
    googleWorkspace: {
      name: string;
      code: string;
      applicable: boolean;
      readinessScore: number;
      examinationPoints: {
        gmailVolume: {
          title: string;
          totalAccounts: number;
          totalMessagesCount: string;
          totalStorageVolumeGB: number;
          averageMailboxGB: number;
        };
        driveInventory: {
          title: string;
          totalMyDrives: number;
          totalSharedDrives: number;
          filesCount: number;
          totalStorageUsedGB: number;
        };
        googleClassroom: {
          title: string;
          activeClasses: number;
          archivedClasses: number;
          totalRosters: number;
          assignmentsIndexed: number;
          courseWorkGradingEnabled: boolean;
        };
        googleGroups: {
          title: string;
          totalGroups: number;
          collaborativeInboxes: number;
          externalMembersAllowed: number;
        };
        vaultHolds: {
          title: string;
          activeMattersCount: number;
          custodiansUnderVaultHold: number;
          exportRetentionPoliciesCount: number;
        };
      };
    };
    applicationsAndSSO: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        registeredApplicationsTotal: {
          title: string;
          totalRegisteredAppsTarget: number;
          registeredApplicationsCount: number;
          enterpriseServicePrincipalsCount: number;
          verifiedPublisherCount: number;
          appsWithAdminConsentGranted: number;
          appsWithExpiringSecrets90Days: number;
        };
        classificationByOwner: {
          title: string;
          breakdown: Array<{ ownerGroup: string; count: number; percentage: number; description: string }>;
        };
        classificationByAuthMethod: {
          title: string;
          sourceTenantEntraNative: {
            total: number;
            oidcOAuth2: number;
            saml20: number;
            wsFederation: number;
            managedIdentity: number;
          };
          externalOrFederatedIdP: {
            total: number;
            oktaFederated: number;
            pingFederate: number;
            googleCloudSso: number;
            salesforceIdp: number;
          };
          sampleApplications: Array<{
            appId: string;
            appName: string;
            ownerCategory: string;
            authMethod: string;
            audience: string;
            lastActivity: string;
          }>;
        };
      };
    };
    securityAndCompliance: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        conditionalAccessPolicies: {
          title: string;
          totalPolicies: number;
          enforcedPoliciesCount: number;
          reportOnlyPoliciesCount: number;
          disabledPoliciesCount: number;
          policies: Array<{ name: string; state: string; targetUsers: string; accessControls: string }>;
        };
        mfaPolicies: {
          title: string;
          mfaEnforcementMethod: string;
          enforcedRatePercent: number;
          fido2PasswordlessRegistered: number;
          microsoftAuthenticatorUsers: number;
          smsVoiceUsersLegacy: number;
        };
        purviewConfiguration: {
          title: string;
          sensitivityLabelsPublished: number;
          autoLabelingPoliciesActive: number;
          encryptionRightsManagementStatus: string;
          labels: Array<{ name: string; scope: string; encryptionEnabled: boolean }>;
        };
        dlpConfiguration: {
          title: string;
          activeDlpPoliciesCount: number;
          enforcedLocations: string[];
          criticalRulePillars: string[];
        };
        retentionRequirements: {
          title: string;
          retentionPoliciesActive: number;
          scopeCovered: string;
          maxRetentionPeriod: string;
        };
        legalHoldRequirements: {
          title: string;
          eDiscoveryCasesActive: number;
          custodianPreservationOrders: number;
          safeguardingComplianceOrders: number;
        };
        safeguardingRequirements: {
          title: string;
          communicationComplianceEnabled: boolean;
          offensiveLanguageFiltersActive: boolean;
          informationBarriersConfigured: boolean;
          safeguardingNote: string;
        };
        dataResidencyConfigurations: {
          title: string;
          tenantPrimaryGeo: string;
          multiGeoEnabled: boolean;
          satellitesConfigured: Array<{ geoCode: string; region: string; workloadAssigned: string }>;
        };
      };
    };
    dataQuality: {
      name: string;
      code: string;
      readinessScore: number;
      examinationPoints: {
        mailboxesExceeding50GB: {
          title: string;
          count: number;
          totalVolumeGB: number;
          remediation: string;
          items: Array<{ upn: string; displayName: string; mailboxSizeGB: number; archiveEnabled: boolean }>;
        };
        staleAccounts: {
          title: string;
          inactiveAccountsCount: number;
          accountsWithoutLicenseAssigned: number;
          orphanedManagersCount: number;
          potentialSavingsAnnualUSD: number;
        };
        duplicateContent: {
          title: string;
          duplicateDocumentsCount: number;
          estimatedDuplicateVolumeGB: number;
          duplicateRatio: string;
        };
        orphanedContent: {
          title: string;
          departedUserOneDrivesCount: number;
          sharePointSitesWithoutOwner: number;
          reclaimableVolumeGB: number;
        };
        dormantTeams: {
          title: string;
          dormantTeamsCount: number;
          criteria: string;
          remediation: string;
        };
        dormantSharePointSites: {
          title: string;
          dormantSitesCount: number;
          criteria: string;
          remediation: string;
        };
      };
    };
  };
}
