import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isValidAlgorandAddress } from '@/lib/api/nodely-enhanced';

interface WalletDebugInfoProps {
  walletAddress: string | null;
}

export default function WalletDebugInfo({ walletAddress }: WalletDebugInfoProps) {
  if (!walletAddress) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-800 font-medium">No wallet connected</p>
          <p className="text-sm text-red-600">Please connect your Algorand wallet first.</p>
        </CardContent>
      </Card>
    );
  }

  const isValid = isValidAlgorandAddress(walletAddress);
  const addressLength = walletAddress.length;
  const expectedLength = 58;

  const testUrls = {
    mainnet_node: `https://mainnet-api.algonode.cloud/v2/accounts/${walletAddress}`,
    mainnet_indexer: `https://mainnet-idx.algonode.cloud/v2/accounts/${walletAddress}`,
    testnet_node: `https://testnet-api.algonode.cloud/v2/accounts/${walletAddress}`,
    testnet_indexer: `https://testnet-idx.algonode.cloud/v2/accounts/${walletAddress}`
  };

  return (
    <Card className={`border-2 ${isValid ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Wallet Debug Information
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "Valid Format" : "Invalid Format"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">Address:</p>
          <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
            {walletAddress}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Length:</p>
            <p className={`text-sm ${addressLength === expectedLength ? 'text-green-600' : 'text-red-600'}`}>
              {addressLength} / {expectedLength} chars
            </p>
          </div>
          <div>
            <p className="font-medium">Format:</p>
            <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
              {isValid ? 'Valid Algorand Address' : 'Invalid Format'}
            </p>
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Test URLs (open in new tab):</p>
          <div className="space-y-2">
            {Object.entries(testUrls).map(([name, url]) => (
              <div key={name} className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  className="text-xs"
                >
                  Test {name.replace('_', ' ')}
                </Button>
                <span className="text-xs text-gray-500">
                  {url.includes('mainnet') ? '🌐 Mainnet' : '🧪 Testnet'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-100 p-3 rounded">
          <p className="text-sm font-medium text-yellow-800">💡 Troubleshooting Tips:</p>
          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
            <li>• If getting 404 errors on mainnet, try the testnet URLs</li>
            <li>• Unfunded addresses won't show up until they receive ALGO</li>
            <li>• Check your wallet is connected to the right network</li>
            <li>• Try disconnecting and reconnecting your wallet</li>
          </ul>
        </div>

        {!isValid && (
          <div className="bg-red-100 p-3 rounded">
            <p className="text-sm font-medium text-red-800">❌ Address Issues:</p>
            <ul className="text-sm text-red-700 mt-1 space-y-1">
              <li>• Address length should be exactly 58 characters</li>
              <li>• Should contain only uppercase letters and digits 2-7</li>
              <li>• Check for copy/paste errors or extra spaces</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
