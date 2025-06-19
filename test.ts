class STABOCollectWrapper {
  constructor(config) {
    this.bridgeApiKey = config.bridgeApiKey;
    this.baseUrl = config.baseUrl || "https://api.bridge.xyz/v0";
    this.defaultWeights = {
      cost: 40,
      speed: 30,
      spread: 20,
      geography: 10,
    };
    this.customers = new Map(); // Cache for customer data
    this.platforms = new Map(); // Cache for platform configurations
  }

  // 1. Initialize STABO as Hifi client
  async initializeSTABO(staboHKEntity) {
    try {
      const customer = await this.createBridgeCustomer({
        type: "business",
        business_name: staboHKEntity.companyName,
        email: staboHKEntity.email,
        address: staboHKEntity.address,
        tax_identification_number: staboHKEntity.taxId,
      });

      this.staboCustomerId = customer.id;
      return { success: true, customerId: customer.id };
    } catch (error) {
      throw new Error(`STABO initialization failed: ${error.message}`);
    }
  }

  // 2. Onboard business customers
  async onboardBusinessCustomer(customerData) {
    try {
      const customer = await this.createBridgeCustomer({
        type: "business",
        business_name: customerData.companyName,
        email: customerData.email,
        address: customerData.address,
        registration_location: customerData.registrationLocation,
        personnel_info: customerData.personnelInfo,
        bank_account_info: customerData.bankAccountInfo,
      });

      // Store customer with platform tagging
      this.customers.set(customer.id, {
        ...customer,
        taggedPlatforms: customerData.preferredPlatforms || ["hifi", "bridge"],
        routingPreferences: customerData.routingPreferences || {},
      });

      return { success: true, customerId: customer.id, customer };
    } catch (error) {
      throw new Error(`Customer onboarding failed: ${error.message}`);
    }
  }

  // 3. Create collect request with intelligent routing
  async createCollectRequest(requestData) {
    const {
      customerId,
      payerCompany,
      payerLocation,
      amount,
      currency = "USD",
      collectionMethod = "BOTH", // WALLET, BANK-ACCOUNT, BOTH
      documents = [],
      routingOverrides = {},
      weightingOverrides = {},
    } = requestData;

    try {
      // Get customer configuration
      const customerConfig = this.customers.get(customerId);
      if (!customerConfig) {
        throw new Error("Customer not found");
      }

      // Select optimal payment rail
      const routingDecision = await this.selectPaymentRail(
        {
          amount,
          currency,
          payerLocation,
          collectionMethod,
          payerCompany,
        },
        customerConfig,
        routingOverrides,
        weightingOverrides
      );

      // Create collection request based on selected platform
      const collectionRequest = await this.createPlatformSpecificRequest(
        routingDecision,
        requestData
      );

      return {
        success: true,
        collectRequestId: collectionRequest.id,
        selectedPlatform: routingDecision.platform,
        paymentLink: collectionRequest.paymentLink,
        routingReason: routingDecision.reasoning,
        alternatives: routingDecision.alternatives,
      };
    } catch (error) {
      throw new Error(`Collect request creation failed: ${error.message}`);
    }
  }

  // Enhanced payment rail selection with dynamic weighting
  async selectPaymentRail(
    collectRequest,
    clientConfig,
    overrides = {},
    weightOverrides = {}
  ) {
    const { amount, currency, payerLocation, collectionMethod, payerCompany } =
      collectRequest;
    const { taggedPlatforms, routingPreferences } = clientConfig;

    // Apply weighting overrides
    const weights = { ...this.defaultWeights, ...weightOverrides };

    // Check for explicit platform override
    if (overrides.forcePlatform) {
      return {
        platform: overrides.forcePlatform,
        reasoning: "Manual override specified",
        score: 100,
        alternatives: [],
      };
    }

    // Filter platforms by collection method and availability
    let availablePlatforms = await this.filterAvailablePlatforms(
      taggedPlatforms,
      collectionMethod,
      payerLocation,
      amount,
      currency
    );

    // Apply geographic restrictions
    if (overrides.excludeRegions) {
      availablePlatforms = availablePlatforms.filter(
        (platform) =>
          !this.isInExcludedRegion(
            platform,
            overrides.excludeRegions,
            payerLocation
          )
      );
    }

    // Get real-time pricing and platform data
    const pricedOptions = await Promise.all(
      availablePlatforms.map(async (platform) => {
        const pricing = await this.getPlatformPricing(
          platform,
          amount,
          currency
        );
        const performance = await this.getPlatformPerformance(
          platform,
          payerLocation
        );

        return {
          platform,
          totalCost: pricing.totalCost,
          fees: pricing.fees,
          spread: pricing.spread,
          speed: performance.settlementHours,
          reliability: performance.reliabilityScore,
          geographic: performance.geographicScore,
          supportedMethods: this.getSupportedMethods(
            platform,
            collectionMethod
          ),
        };
      })
    );

    // Calculate weighted scores
    const scoredOptions = pricedOptions.map((option) => ({
      ...option,
      score: this.calculateWeightedScore(
        option,
        weights,
        amount,
        payerLocation,
        routingPreferences
      ),
    }));

    // Sort by score and apply business rules
    const ranked = scoredOptions.sort((a, b) => b.score - a.score);
    const selected = this.applyBusinessRules(ranked, collectRequest, overrides);

    return {
      platform: selected.platform,
      reasoning: this.generateReasoningText(selected, ranked),
      score: selected.score,
      alternatives: ranked.slice(0, 3).map((opt) => ({
        platform: opt.platform,
        score: opt.score,
        costDiff: opt.totalCost - selected.totalCost,
        speedDiff: opt.speed - selected.speed,
      })),
    };
  }

  // Dynamic weighted scoring with configurable parameters
  calculateWeightedScore(
    option,
    weights,
    amount,
    payerLocation,
    preferences = {}
  ) {
    let score = 0;

    // Cost efficiency (lower cost = higher score)
    const costScore =
      amount > 10000
        ? (1 / (option.totalCost / amount)) * 100 // Percentage-based for large amounts
        : Math.max(0, 100 - option.totalCost * 2); // Fixed penalty for small amounts
    score += (costScore * weights.cost) / 100;

    // Speed score (faster = higher score)
    const speedScore = Math.max(0, 100 - option.speed * 2); // 2 points per hour penalty
    score += (speedScore * weights.speed) / 100;

    // Spread score (tighter spread = higher score)
    const spreadScore = Math.max(0, 100 - option.spread * 1000); // Convert spread to percentage
    score += (spreadScore * weights.spread) / 100;

    // Geographic optimization
    const geoScore = option.geographic || 50; // Default neutral score
    score += (geoScore * weights.geography) / 100;

    // Apply customer preferences
    if (preferences.preferredPlatforms?.includes(option.platform)) {
      score *= 1.2; // 20% bonus for preferred platforms
    }

    if (preferences.avoidPlatforms?.includes(option.platform)) {
      score *= 0.5; // 50% penalty for avoided platforms
    }

    // Reliability multiplier
    score *= (option.reliability || 100) / 100;

    return Math.round(score * 100) / 100;
  }

  // Apply business rules and compliance checks
  applyBusinessRules(rankedOptions, collectRequest, overrides) {
    const { amount, currency, payerLocation } = collectRequest;

    for (const option of rankedOptions) {
      // Amount limits check
      if (amount > this.getPlatformMaxAmount(option.platform)) {
        continue;
      }

      // Compliance checks
      if (!this.passesComplianceCheck(option.platform, payerLocation, amount)) {
        continue;
      }

      // Minimum score threshold
      if (option.score < (overrides.minScore || 30)) {
        continue;
      }

      return option;
    }

    // Fallback to highest scored option if all fail business rules
    return rankedOptions[0];
  }

  // Create platform-specific collection request
  async createPlatformSpecificRequest(routingDecision, requestData) {
    const { platform } = routingDecision;
    const { customerId, amount, currency, payerCompany } = requestData;

    switch (platform) {
      case "bridge":
        return await this.createBridgeCollectRequest(requestData);

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // Bridge-specific collection request
  async createBridgeCollectRequest(requestData) {
    const virtualAccount = await this.callBridgeAPI(
      `/customers/${requestData.customerId}/virtual_accounts`,
      "POST",
      {
        source: {
          currency: requestData.currency.toLowerCase(),
          payment_rail: "ach",
        },
        destination: {
          currency: "usdc",
          payment_rail: "ethereum",
          address: requestData.destinationAddress,
        },
      }
    );

    return {
      id: virtualAccount.id,
      paymentLink: this.generateVirtualAccountLink(virtualAccount),
      depositInstructions: virtualAccount.source_deposit_instructions,
    };
  }

  // Utility methods
  async filterAvailablePlatforms(
    taggedPlatforms,
    collectionMethod,
    payerLocation,
    amount,
    currency
  ) {
    let platforms = [...taggedPlatforms];

    // Filter by collection method
    if (collectionMethod === "WALLET") {
      platforms = platforms.filter(
        (p) =>
          p.includes("crypto") || p.includes("usdc") || p.includes("ethereum")
      );
    } else if (collectionMethod === "BANK-ACCOUNT") {
      platforms = platforms.filter(
        (p) => p.includes("ach") || p.includes("wire") || p.includes("sepa")
      );
    }

    // Check platform availability for region
    return platforms.filter((platform) =>
      this.isPlatformAvailableInRegion(platform, payerLocation)
    );
  }

  async getPlatformPricing(platform, amount, currency) {
    // Mock pricing - in production, call actual platform APIs
    const mockPricing = {
      hifi: { totalCost: amount * 0.015, fees: amount * 0.01, spread: 0.005 },
      bridge: { totalCost: amount * 0.02, fees: amount * 0.015, spread: 0.003 },
      wise: { totalCost: amount * 0.012, fees: amount * 0.008, spread: 0.004 },
    };

    return (
      mockPricing[platform] || {
        totalCost: amount * 0.025,
        fees: amount * 0.02,
        spread: 0.01,
      }
    );
  }

  async getPlatformPerformance(platform, payerLocation) {
    // Mock performance data - in production, fetch from monitoring systems
    const mockPerformance = {
      hifi: { settlementHours: 24, reliabilityScore: 95, geographicScore: 80 },
      bridge: { settlementHours: 2, reliabilityScore: 98, geographicScore: 90 },
      wise: { settlementHours: 6, reliabilityScore: 96, geographicScore: 85 },
    };

    return (
      mockPerformance[platform] || {
        settlementHours: 48,
        reliabilityScore: 85,
        geographicScore: 70,
      }
    );
  }

  generateReasoningText(selected, alternatives) {
    const reasons = [];

    if (selected.score > 80) reasons.push("High overall score");
    if (selected.totalCost < alternatives[1]?.totalCost)
      reasons.push("Most cost-effective");
    if (selected.speed < 6) reasons.push("Fast settlement");
    if (selected.reliability > 95) reasons.push("High reliability");

    return reasons.join(", ") || "Best available option";
  }

  isPlatformAvailableInRegion(platform, region) {
    // Mock regional availability - implement actual regional logic
    const availability = {
      hifi: ["US", "CA", "EU"],
      bridge: ["US", "EU", "APAC"],
      wise: ["global"],
    };

    return (
      availability[platform]?.includes(region) ||
      availability[platform]?.includes("global")
    );
  }

  passesComplianceCheck(platform, payerLocation, amount) {
    // Implement compliance rules
    if (amount > 250000 && platform === "simple_platform") return false;
    if (payerLocation === "restricted_country") return false;
    return true;
  }

  getPlatformMaxAmount(platform) {
    const limits = {
      hifi: 1000000,
      bridge: 500000,
      wise: 2000000,
    };
    return limits[platform] || 100000;
  }

  generatePaymentLink(transfer) {
    return `https://pay.stabo.com/collect/${transfer.id}`;
  }

  generateVirtualAccountLink(virtualAccount) {
    return `https://pay.stabo.com/virtual/${virtualAccount.id}`;
  }

  // Bridge API helper
  async callBridgeAPI(endpoint, method, data = null) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.bridgeApiKey,
      },
      body: data ? JSON.stringify(data) : null,
    });

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async createBridgeCustomer(customerData) {
    return await this.callBridgeAPI("/customers", "POST", customerData);
  }

  // Webhook handler for payment confirmations
  async handleWebhook(webhookData) {
    const { type, data } = webhookData;

    switch (type) {
      case "payment.completed":
        await this.notifyCustomer(data.customer_id, "payment_received", data);
        break;
      case "payment.failed":
        await this.notifyCustomer(data.customer_id, "payment_failed", data);
        break;
    }
  }

  async notifyCustomer(customerId, eventType, data) {
    // Implement customer notification logic
    console.log(`Notifying customer ${customerId} of ${eventType}:`, data);
  }

  // Advanced routing features
  async updateRoutingWeights(newWeights) {
    this.defaultWeights = { ...this.defaultWeights, ...newWeights };
  }

  async getRoutingAnalytics(timeframe = "30d") {
    // Return routing performance analytics
    return {
      totalTransactions: 1250,
      platformDistribution: {
        hifi: 45,
        bridge: 35,
        wise: 20,
      },
      averageScore: 82.5,
      costSavings: 12.3, // percentage
    };
  }

  async simulateRouting(requestData, scenarios = []) {
    // Simulate different routing scenarios for testing
    const results = [];

    for (const scenario of scenarios) {
      const result = await this.selectPaymentRail(
        requestData,
        { taggedPlatforms: ["hifi", "bridge", "wise"] },
        scenario.overrides,
        scenario.weights
      );
      results.push({ scenario: scenario.name, result });
    }

    return results;
  }
}
