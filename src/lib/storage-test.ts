import { supabase } from '../auth';
import { STORAGE_BUCKETS } from './constants';

/**
 * Test and setup storage bucket for persona content
 */
export async function testAndSetupStorage() {
  try {
    console.log('Testing storage bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return { success: false, error: bucketsError.message };
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    const personaContentBucket = buckets?.find(bucket => bucket.name === 'persona-content');
    
    if (!personaContentBucket) {
      console.log('persona-content bucket not found. This needs to be created manually in Supabase dashboard.');
      return { 
        success: false, 
        error: 'persona-content bucket not found. Please create it in Supabase dashboard.' 
      };
    }
    
    console.log('persona-content bucket found:', personaContentBucket);
    
    // Test upload capability with a small test file
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = new Blob(['test content'], { type: 'text/plain' });
    
    const { error: uploadError } = await supabase.storage
      .from('persona-content')
      .upload(`test/${testFileName}`, testContent);
    
    if (uploadError) {
      console.error('Upload test failed:', uploadError);
      return { 
        success: false, 
        error: `Upload failed: ${uploadError.message}` 
      };
    }
    
    console.log('Upload test successful');
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('persona-content')
      .remove([`test/${testFileName}`]);
    
    if (deleteError) {
      console.warn('Failed to clean up test file:', deleteError);
    }
    
    // Test folder structure
    const testFolders = ['training-videos', 'audio', 'thumbnails'];
    const folderTests = [];
    
    for (const folder of testFolders) {
      const testFile = `${folder}/test-${Date.now()}.txt`;
      const { error: folderUploadError } = await supabase.storage
        .from('persona-content')
        .upload(testFile, testContent);
      
      if (folderUploadError) {
        folderTests.push({ folder, success: false, error: folderUploadError.message });
      } else {
        folderTests.push({ folder, success: true });
        // Clean up
        await supabase.storage
          .from('persona-content')
          .remove([testFile]);
      }
    }
    
    console.log('Folder tests:', folderTests);
    
    return { 
      success: true, 
      bucket: personaContentBucket,
      folderTests 
    };
    
  } catch (error) {
    console.error('Storage test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get storage usage and limits
 */
export async function getStorageInfo() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const personaBucket = buckets?.find(b => b.name === 'persona-content');
    
    if (!personaBucket) {
      return { error: 'persona-content bucket not found' };
    }
    
    // List some files to check structure
    const { data: files } = await supabase.storage
      .from('persona-content')
      .list('', { limit: 10 });
    
    return {
      bucket: personaBucket,
      fileCount: files?.length || 0,
      files: files?.slice(0, 5) // Show first 5 files
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test all organized storage buckets
 */
export async function testAllStorageBuckets() {
  try {
    console.log('Testing all storage buckets...');
    
    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return { success: false, error: bucketsError.message };
    }
      console.log('Available buckets:', buckets?.map((b: any) => b.name));
    
    // Test each bucket
    const bucketResults = [];
    const testContent = new Blob(['test content'], { type: 'text/plain' });
    
    for (const [bucketKey, bucketName] of Object.entries(STORAGE_BUCKETS)) {
      const bucket = buckets?.find((b: any) => b.name === bucketName);
      
      if (!bucket) {
        bucketResults.push({
          key: bucketKey,
          name: bucketName,
          exists: false,
          error: 'Bucket not found'
        });
        continue;
      }
      
      // Test upload capability
      const testFileName = `test/test-${Date.now()}.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testContent);
      
      if (uploadError) {
        bucketResults.push({
          key: bucketKey,
          name: bucketName,
          exists: true,
          canUpload: false,
          error: uploadError.message
        });
        continue;
      }
      
      // Test delete capability
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([testFileName]);
      
      bucketResults.push({
        key: bucketKey,
        name: bucketName,
        exists: true,
        canUpload: true,
        canDelete: !deleteError,
        deleteError: deleteError?.message
      });
    }
    
    const successfulBuckets = bucketResults.filter(b => b.exists && b.canUpload);
    const failedBuckets = bucketResults.filter(b => !b.exists || !b.canUpload);
    
    return {
      success: failedBuckets.length === 0,
      totalBuckets: bucketResults.length,
      successfulBuckets: successfulBuckets.length,
      failedBuckets: failedBuckets.length,
      results: bucketResults
    };
    
  } catch (error) {
    console.error('Storage test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create missing storage buckets via SQL migration
 */
export async function getMigrationStatus() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
      const expectedBuckets = Object.values(STORAGE_BUCKETS);
    const existingBuckets = buckets?.map((b: any) => b.name) || [];
    const missingBuckets = expectedBuckets.filter(name => !existingBuckets.includes(name));
    
    return {
      expectedBuckets,
      existingBuckets,
      missingBuckets,
      needsMigration: missingBuckets.length > 0
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
