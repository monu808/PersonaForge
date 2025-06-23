# Video File Upload Guidelines

## File Size Limitations

**Maximum file size:** 50MB  
**Recommended size:** 25MB or less for reliable uploads

## Why These Limits Exist

- **Supabase Storage:** Default upload limit is 50MB per file
- **Upload Reliability:** Smaller files upload faster and more reliably
- **Processing Efficiency:** Smaller files process quicker in the Tavus API

## Video Compression Options

If your video exceeds the 50MB limit, here are several free options to compress it:

### Online Compression Tools
1. **CloudConvert** (https://cloudconvert.com)
   - Supports many formats
   - Adjustable quality settings
   - Free tier available

2. **FreeConvert** (https://www.freeconvert.com/video-compressor)
   - Easy drag-and-drop interface
   - Batch compression
   - No registration required

3. **Clipchamp** (https://clipchamp.com)
   - Microsoft-owned
   - Advanced editing features
   - Built into Windows 11

### Desktop Software
1. **HandBrake** (Free, open-source)
   - Advanced compression settings
   - Batch processing
   - Available for Windows, Mac, Linux

2. **VLC Media Player** (Free)
   - Built-in conversion tools
   - Simple interface
   - Widely available

### Quick Compression Tips

1. **Reduce Resolution:**
   - If your video is 1080p, try reducing to 720p
   - Most training videos work fine at 720p

2. **Adjust Bitrate:**
   - Lower bitrate = smaller file size
   - For training videos, 1-3 Mbps is usually sufficient

3. **Trim Duration:**
   - Keep videos between 15-30 seconds
   - Longer videos aren't always better for training

4. **Choose Efficient Format:**
   - MP4 with H.264 codec is usually most efficient
   - Avoid uncompressed formats

## Technical Requirements

- **Duration:** 10-120 seconds (30 seconds recommended)
- **Resolution:** 720p minimum, 1080p recommended
- **Formats:** MP4, MOV, WebM
- **Audio:** Clear speech required for consent phrase
- **Content:** Single person, front-facing, well-lit

## Troubleshooting Upload Errors

### "Object exceeded maximum allowed size"
- Your file is over 50MB
- Use compression tools listed above
- Consider shorter duration or lower resolution

### "Bad Request" errors
- Usually indicates file size issues
- Try compressing to under 25MB
- Ensure file format is supported

### Upload timeout/failure
- Check internet connection stability
- Try uploading during off-peak hours
- Consider compressing file further

## Contact Support

If you continue experiencing issues after trying these solutions, please contact support with:
- File size and format details
- Error message text
- Compression tools attempted
