import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  BarChart3,
  Eye,
  Download,
  Globe,
  Zap
} from 'lucide-react';
import { 
  getEnhancedAccountInfo,
  getEnhancedAccountInfoSafe,
  getServicePaymentHistory,
  getNetworkMetrics,
  uploadToIPFS,
  isValidAlgorandAddress,
  type AccountAnalytics,
  type PaymentHistory,
  type NetworkMetrics
} from '@/lib/api/nodely-enhanced';
import { toast } from '@/components/ui/use-toast';
import WalletDebugInfo from '@/components/debug/WalletDebugInfo';
import NetworkSwitcher from '@/components/network/NetworkSwitcher';

interface EnhancedAnalyticsDashboardProps {
  walletAddress: string | null;
  onClose: () => void;
}

export default function EnhancedAnalyticsDashboard({ 
  walletAddress, 
  onClose 
}: EnhancedAnalyticsDashboardProps) {
  const [accountAnalytics, setAccountAnalytics] = useState<AccountAnalytics | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTestnet, setIsTestnet] = useState(true); // Default to testnet for development
  const loadAnalytics = async () => {
    if (!walletAddress) return;

    // First validate the address format
    if (!isValidAlgorandAddress(walletAddress)) {
      toast({
        title: "Invalid Address",
        description: "The wallet address format is invalid. Please check your wallet connection.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Load enhanced account analytics using Nodely's indexer
      const [analytics, payments, network] = await Promise.all([
        getEnhancedAccountInfoSafe(walletAddress),
        getServicePaymentHistory(walletAddress).catch(() => ({
          transactions: [],
          total_payments: 0,
          total_amount_algo: 0,
          total_amount_usd: 0,
          top_services: []
        })),
        getNetworkMetrics().catch(() => null)
      ]);

      setAccountAnalytics(analytics);
      setPaymentHistory(payments);
      setNetworkMetrics(network);      if (analytics.error) {
        toast({
          title: "Account Info Warning",
          description: analytics.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analytics Loaded",
          description: analytics.balance === 0 && analytics.transaction_count === 0 
            ? "Account not found on mainnet. This might be a testnet address or unfunded account."
            : "Enhanced analytics powered by Nodely infrastructure",
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics. Please check your internet connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToIPFS = async () => {
    if (!accountAnalytics || !paymentHistory) return;

    try {
      const analyticsData = {
        account: accountAnalytics,
        payments: paymentHistory,
        network: networkMetrics,
        exported_at: new Date().toISOString(),
        wallet_address: walletAddress
      };

      const result = await uploadToIPFS(
        JSON.stringify(analyticsData, null, 2),
        `persona-analytics-${Date.now()}.json`
      );

      if (result.success) {
        toast({
          title: "Analytics Exported",
          description: `Data stored on IPFS: ${result.hash}`,
        });
        
        // Copy IPFS URL to clipboard
        if (result.url) {
          navigator.clipboard.writeText(result.url);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error exporting to IPFS:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics to IPFS",
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    if (walletAddress) {
      loadAnalytics();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Connect your wallet to view enhanced analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced Analytics
            </h2>
            <p className="text-muted-foreground">
              Powered by Nodely Infrastructure - Your Premium Subscription
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToIPFS} disabled={!accountAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export to IPFS
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Wallet Debug Info */}
      <WalletDebugInfo walletAddress={walletAddress} />      {/* Network Switcher */}
      <NetworkSwitcher onNetworkChange={(testnet) => {
        setIsTestnet(testnet);
        // Trigger reload of analytics when network changes
        if (walletAddress) {
          loadAnalytics();
        }
      }} />

      {/* Network Status */}
      {networkMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Algorand Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {networkMetrics.last_round.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Current Round</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {networkMetrics.tps}
                </div>
                <div className="text-sm text-muted-foreground">TPS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {networkMetrics.block_time.toFixed(1)}s
                </div>
                <div className="text-sm text-muted-foreground">Block Time</div>
              </div>
              <div className="text-center">
                <Badge variant={networkMetrics.has_sync_data ? "default" : "destructive"}>
                  {networkMetrics.has_sync_data ? "Synced" : "Syncing"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}      {/* Account Analytics */}
      {accountAnalytics && (
        <>
          {accountAnalytics.balance === 0 && accountAnalytics.transaction_count === 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    ⚠️
                  </div>
                  <div>
                    <p className="font-medium text-yellow-800">Account Not Found</p>
                    <p className="text-sm text-yellow-600">
                      This wallet address doesn't exist on Algorand mainnet. It might be:
                    </p>
                    <ul className="text-sm text-yellow-600 ml-4 mt-1">
                      <li>• A testnet address (switch to testnet in your wallet)</li>
                      <li>• An unfunded mainnet address (send some ALGO to activate)</li>
                      <li>• An invalid address format</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{accountAnalytics.balance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">ALGO Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{accountAnalytics.transaction_count}</p>
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{accountAnalytics.total_assets_opted_in}</p>
                  <p className="text-xs text-muted-foreground">Assets Opted In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{accountAnalytics.total_apps_opted_in}</p>
                  <p className="text-xs text-muted-foreground">Apps Opted In</p>
                </div>
              </div>
            </CardContent>          </Card>
        </div>
        </>
      )}

      {/* Payment History */}
      {paymentHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Service Payment Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {paymentHistory.total_payments}
                </div>
                <div className="text-sm text-muted-foreground">Total Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {paymentHistory.total_amount_algo.toFixed(2)} ALGO
                </div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ${paymentHistory.total_amount_usd.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">USD Equivalent</div>
              </div>
            </div>

            {/* Top Services */}
            {paymentHistory.top_services.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Top Services</h4>
                <div className="space-y-2">
                  {paymentHistory.top_services.slice(0, 5).map((service, index) => (
                    <div key={service.service_id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{service.service_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.count} payments
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{service.total_amount.toFixed(2)} ALGO</div>
                        <div className="text-sm text-muted-foreground">
                          ${(service.total_amount * 0.25).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nodely Subscription Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Your Nodely Subscription Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 6,000 requests/second (vs 60 free)</li>
                <li>• 500 requests/second per IP</li>
                <li>• 99.995% SLA with reimbursement</li>
                <li>• Low latency bare-metal infrastructure</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlimited IPFS Gateway access</li>
                <li>• Archival data and historical queries</li>
                <li>• Advanced indexer capabilities</li>
                <li>• Enhanced monitoring and analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      )}
    </div>
  );
}
