import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardMedia } from '@mui/material';
import { Checkbox, FormControlLabel, Slider, TextField } from '@mui/material';

// Active tab ID to communicate with new window
const getTabIdFromURL = () => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get('tabId');
};

// Utility functions to convert time
const convertTimeToSeconds = (timeString) => {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return minutes * 60 + seconds;
};

const convertSecondsToTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

const App = () => {
  // Extract tab ID from URL
  const tabId = parseInt(getTabIdFromURL());

  // States
  const [thumbnail, setThumbnail] = useState('');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopRange, setLoopRange] = useState([0, 100]); // Example range, replace with video duration
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00'); // Replace with video duration

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

  // Send command to content script
  const sendCommandToContentScript = (command) => {
    chrome.tabs.sendMessage(tabId, {
      message: 'ControlVideoPlayback',
      command: command,
      startTime: convertTimeToSeconds(startTime),
      endTime: convertTimeToSeconds(endTime),
    });
  };

  // Toggle loop on/off
  const toggleLoop = (event) => {
    setLoopEnabled(event.target.checked);
    if (event.target.checked) {
      sendCommandToContentScript('startLoop');
    } else {
      sendCommandToContentScript('stopLoop');
    }
  };

  // Handle slider change
  const handleSliderChange = (event, newValue) => {
    setLoopRange(newValue);
    setStartTime(convertSecondsToTime(newValue[0]));
    setEndTime(convertSecondsToTime(newValue[1]));
  };

  // Handle manual time input
  const handleTimeInput = (event, isStart) => {
    if (isStart) {
      setStartTime(event.target.value);
    } else {
      setEndTime(event.target.value);
    }
    setLoopRange([
      convertTimeToSeconds(startTime),
      convertTimeToSeconds(endTime),
    ]);
  };

  // Handle double-click on input box
  const handleDoubleClick = () => {
    // Logic to get current video timestamp and update input box
  };

  // Mount
  useEffect(() => {
    if (!isNaN(tabId)) {
      chrome.tabs.sendMessage(
        tabId,
        { message: 'GetYoutubeVideoId' },
        (response) => {
          if (response && response.videoId) {
            fetchVideoDetails(response.videoId);
          }
        }
      );
    }
  }, [tabId]);

  return (
    <Box sx={{ padding: 2 }}>
      {/* Thumbnail display */}
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

      {/* Loop Checkbox */}
      <FormControlLabel
        control={<Checkbox checked={loopEnabled} onChange={toggleLoop} />}
        label="Enable Loop"
      />

      {/* Time Range Slider */}
      <Slider
        value={loopRange}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        min={0}
        max={100} // Replace with video duration
      />

      {/* Time Input Boxes */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          label="Start Time"
          value={startTime}
          onChange={handleTimeInput}
          onDoubleClick={handleDoubleClick}
          sx={{ width: '45%' }}
        />
        <TextField
          label="End Time"
          value={endTime}
          onChange={handleTimeInput}
          onDoubleClick={handleDoubleClick}
          sx={{ width: '45%' }}
        />
      </Box>
    </Box>
  );
};

export default App;
