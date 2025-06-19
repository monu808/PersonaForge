import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NetworkSwitcherProps {
  onNetworkChange: (isTestnet: boolean) => void;
}

export default function NetworkSwitcher({ onNetworkChange }: NetworkSwitcherProps) {
  const [isTestnet, setIsTestnet] = useState(true); // Default to testnet for development

  const handleNetworkSwitch = () => {
    const newIsTestnet = !isTestnet;
    setIsTestnet(newIsTestnet);
    onNetworkChange(newIsTestnet);
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🌐 Network Selection</span>
          <Badge variant={isTestnet ? "secondary" : "default"}>
            {isTestnet ? "Testnet" : "Mainnet"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {isTestnet ? "🧪 Testnet Mode" : "🌐 Mainnet Mode"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isTestnet 
                ? "Using Algorand testnet for development and testing"
                : "Using Algorand mainnet for production"
              }
            </p>
          </div>
          <Button 
            variant={isTestnet ? "default" : "outline"}
            onClick={handleNetworkSwitch}
            className="ml-4"
          >
            Switch to {isTestnet ? "Mainnet" : "Testnet"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Testnet Benefits:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Free ALGO from faucet</li>
              <li>• Safe for testing</li>
              <li>• No real money risk</li>
              <li>• Fast development</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Mainnet Benefits:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Real transactions</li>
              <li>• Production ready</li>
              <li>• Actual ALGO payments</li>
              <li>• Live marketplace</li>
            </ul>
          </div>
        </div>

        {isTestnet && (
          <div className="bg-green-100 p-3 rounded">
            <p className="text-sm font-medium text-green-800">💡 Get Testnet ALGO:</p>
            <p className="text-sm text-green-700 mt-1">
              Visit the Algorand testnet dispenser to get free test ALGO:
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://testnet.algoexplorer.io/dispenser', '_blank')}
            >
              Open Testnet Faucet
            </Button>
          </div>
        )}

        {!isTestnet && (
          <div className="bg-yellow-100 p-3 rounded">
            <p className="text-sm font-medium text-yellow-800">⚠️ Mainnet Warning:</p>
            <p className="text-sm text-yellow-700 mt-1">
              You're using real ALGO. Make sure your wallet is funded and you understand the costs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
