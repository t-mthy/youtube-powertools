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

// Utility function to convert ISO 8601 duration string to seconds int
const convertISO8601ToSeconds = (iso8601Duration) => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = regex.exec(iso8601Duration);

  const hours = parseInt(matches[1]) || 0;
  const minutes = parseInt(matches[2]) || 0;
  const seconds = parseInt(matches[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
};

const App = () => {
  // Extract tab ID from URL
  const tabId = parseInt(getTabIdFromURL());

  // States
  const [thumbnail, setThumbnail] = useState('');
  const [videoDuration, setVideoDuration] = useState(0); // State for video duration
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopRange, setLoopRange] = useState([0, 100]); // Initial range, to be updated
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00'); // To be updated based on video duration

  // Fetch video details including duration
  const fetchVideoDetails = async (videoId) => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const result = response.data.items[0];

      const thumbnailUrl = result.snippet.thumbnails.high.url;
      const duration = result.contentDetails.duration;
      const durationInSeconds = convertISO8601ToSeconds(duration) - 1; // YT 1 sec less in actual video
      setThumbnail(thumbnailUrl);
      setVideoDuration(durationInSeconds);
      setLoopRange([0, durationInSeconds]);
      setEndTime(convertSecondsToTime(durationInSeconds));
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
    const timeValue = event.target.value;
    if (isStart) {
      setStartTime(timeValue);
    } else {
      setEndTime(timeValue);
    }
    setLoopRange([
      convertTimeToSeconds(startTime),
      convertTimeToSeconds(endTime),
    ]);
  };

  // Fetch current video time from content script for double-click
  const fetchCurrentVideoTime = async () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { message: 'GetCurrentVideoTime' },
        (response) => {
          if (response && response.currentTime) {
            resolve(response.currentTime);
          } else {
            reject('Failed to fetch current video time');
          }
        }
      );
    });
  };

  // Handle double-click on start time input box
  const handleDoubleClickStartTime = async () => {
    try {
      const currentTime = await fetchCurrentVideoTime();
      const formattedTime = convertSecondsToTime(currentTime);
      setStartTime(formattedTime);
      setLoopRange([
        convertTimeToSeconds(formattedTime),
        convertTimeToSeconds(endTime),
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  // Handle double-click on end time input box
  const handleDoubleClickEndTime = async () => {
    try {
      const currentTime = await fetchCurrentVideoTime();
      const formattedTime = convertSecondsToTime(currentTime);
      setEndTime(formattedTime);
      setLoopRange([
        convertTimeToSeconds(startTime),
        convertTimeToSeconds(formattedTime),
      ]);
    } catch (error) {
      console.error(error);
    }
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
        control={
          <Checkbox
            checked={loopEnabled}
            onChange={toggleLoop}
            sx={{ color: 'red', '&.Mui-checked': { color: 'red' } }}
          />
        }
        label="Enable Loop"
      />

      {/* Time Range Slider */}
      <Slider
        value={loopRange}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        min={0}
        max={videoDuration} // Set max to video duration
        sx={{ color: 'red' }}
      />

      {/* Time Input Boxes */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          label="Start Time"
          value={startTime}
          onChange={(e) => handleTimeInput(e, true)}
          onDoubleClick={handleDoubleClickStartTime}
          sx={{ width: '45%' }}
        />
        <TextField
          label="End Time"
          value={endTime}
          onChange={(e) => handleTimeInput(e, false)}
          onDoubleClick={handleDoubleClickEndTime}
          sx={{ width: '45%' }}
        />
      </Box>
    </Box>
  );
};

export default App;
