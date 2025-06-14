import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle, Database, FolderOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { testAndSetupStorage, getStorageInfo, testAllStorageBuckets, getMigrationStatus } from '@/lib/storage-test';

export function StorageTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [allBucketsResult, setAllBucketsResult] = useState<any>(null);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const runStorageTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testAndSetupStorage();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Storage Test Passed",
          description: "Storage bucket is properly configured",
        });
      } else {
        toast({
          title: "Storage Test Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({ success: false, error: errorMessage });
      toast({
        title: "Storage Test Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageDetails = async () => {
    try {
      const info = await getStorageInfo();
      setStorageInfo(info);
      
      if (info.error) {
        toast({
          title: "Storage Info Error",
          description: info.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Storage Info Retrieved",
          description: `Found ${info.fileCount} files in bucket`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get storage info",
        variant: "destructive"
      });
    }
  };

  const testAllBuckets = async () => {
    setIsTestingAll(true);
    setAllBucketsResult(null);
    
    try {
      const result = await testAllStorageBuckets();
      setAllBucketsResult(result);
      
      if (result.success) {
        toast({
          title: "All Storage Buckets Tested",
          description: `${result.successfulBuckets}/${result.totalBuckets} buckets working correctly`,
        });
      } else {
        toast({
          title: "Storage Issues Found",
          description: `${result.failedBuckets} buckets have issues`,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAllBucketsResult({ success: false, error: errorMessage });
      toast({
        title: "Bucket Test Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingAll(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      const status = await getMigrationStatus();
      setMigrationStatus(status);
      
      if (status.error) {
        toast({
          title: "Migration Check Failed",
          description: status.error,
          variant: "destructive"
        });
      } else if (status.needsMigration) {
        toast({
          title: "Migration Required",
          description: `${status.missingBuckets.length} buckets need to be created`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "All Buckets Present",
          description: "No migration needed",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMigrationStatus({ error: errorMessage });
      toast({
        title: "Migration Check Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Configuration Test
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test the storage bucket configuration and permissions for file uploads.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runStorageTest}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Storage Setup
          </Button>
          <Button 
            onClick={getStorageDetails}
            variant="outline"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Get Storage Info
          </Button>
          <Button 
            onClick={testAllBuckets}
            disabled={isTestingAll}
            variant="secondary"
          >
            {isTestingAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Database className="h-4 w-4 mr-2" />
            Test All Buckets
          </Button>
          <Button 
            onClick={checkMigrationStatus}
            variant="outline"
          >
            Check Migration Status
          </Button>
        </div>

        {testResult && (
          <div className={`p-4 border rounded-md ${
            testResult.success 
              ? 'text-green-600 bg-green-50 border-green-200' 
              : 'text-red-600 bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">
                  Storage Test {testResult.success ? 'Passed' : 'Failed'}
                </div>
                {testResult.error && (
                  <div className="text-sm mt-1">{testResult.error}</div>
                )}
                {testResult.folderTests && (
                  <div className="text-sm mt-2">
                    <div className="font-medium">Folder Tests:</div>
                    {testResult.folderTests.map((test: any, index: number) => (
                      <div key={index} className="ml-2">
                        • {test.folder}: {test.success ? '✓ Success' : `✗ Failed - ${test.error}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {storageInfo && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-blue-800">Storage Information</div>
                {storageInfo.error ? (
                  <div className="text-sm text-red-600 mt-1">{storageInfo.error}</div>
                ) : (
                  <div className="text-sm text-blue-700 mt-1">
                    <div>Bucket: {storageInfo.bucket?.name}</div>
                    <div>Public: {storageInfo.bucket?.public ? 'Yes' : 'No'}</div>
                    <div>Files: {storageInfo.fileCount}</div>
                    {storageInfo.files && storageInfo.files.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">Recent files:</div>
                        {storageInfo.files.map((file: any, index: number) => (
                          <div key={index} className="ml-2 text-xs">
                            • {file.name} ({file.metadata?.size || 'unknown size'})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {allBucketsResult && (
          <div className={`p-4 border rounded-md ${
            allBucketsResult.success 
              ? 'text-green-600 bg-green-50 border-green-200' 
              : 'text-red-600 bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {allBucketsResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">All Buckets Test Results</div>
                {allBucketsResult.error ? (
                  <div className="text-sm mt-1">{allBucketsResult.error}</div>
                ) : (
                  <div className="text-sm mt-1">
                    <div>Total buckets: {allBucketsResult.totalBuckets}</div>
                    <div>Successful: {allBucketsResult.successfulBuckets}</div>
                    <div>Failed: {allBucketsResult.failedBuckets}</div>
                    {allBucketsResult.results && (
                      <div className="mt-3 space-y-2">
                        {allBucketsResult.results.map((bucket: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white bg-opacity-50 rounded text-xs">
                            <span className="font-medium">{bucket.name}</span>
                            <div className="flex items-center gap-2">
                              {bucket.exists ? (
                                <span className="text-green-600">✓ Exists</span>
                              ) : (
                                <span className="text-red-600">✗ Missing</span>
                              )}
                              {bucket.canUpload && (
                                <span className="text-green-600">✓ Upload</span>
                              )}
                              {bucket.canDelete && (
                                <span className="text-green-600">✓ Delete</span>
                              )}
                              {bucket.error && (
                                <span className="text-red-600 truncate max-w-24" title={bucket.error}>
                                  ✗ {bucket.error.substring(0, 10)}...
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {migrationStatus && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800">Migration Status</div>
                {migrationStatus.error ? (
                  <div className="text-sm text-red-600 mt-1">{migrationStatus.error}</div>
                ) : migrationStatus.needsMigration ? (
                  <div className="text-sm text-red-700 mt-1">
                    Migration required: {migrationStatus.missingBuckets.length} buckets need to be created.
                  </div>
                ) : (
                  <div className="text-sm text-yellow-700 mt-1">
                    All buckets are present. No migration needed.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Storage Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Bucket 'persona-content' must exist</li>
            <li>Upload permissions for authenticated users</li>
            <li>Public read access for generated content</li>
            <li>Support for video files (training videos)</li>
            <li>Support for audio files (voice cloning)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
