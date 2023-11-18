import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardMedia } from '@mui/material';

const App = () => {
  // States
  const [thumbnail, setThumbnail] = useState('');

  // Video details
  const fetchVideoDetails = async (videoId) => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const thumbnailUrl = response.data.items[0].snippet.thumbnails.high.url;
      setThumbnail(thumbnailUrl);
    } catch (error) {
      console.error('Error fetching video details:', error);
    }
  };

  // Mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { message: 'GetYoutubeVideoId' },
        (response) => {
          if (response && response.videoId) {
            fetchVideoDetails(response.videoId);
          }
        }
      );
    });
  }, []);

  return (
    <Box sx={{ padding: 2 }}>
      {thumbnail && (
        <Card>
          <CardMedia
            component="img"
            image={thumbnail}
            alt="Video Thumbnail"
            sx={{ height: 210, width: 375 }}
          />
        </Card>
      )}
    </Box>
  );
};

export default App;
