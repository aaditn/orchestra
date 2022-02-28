import { useEffect, useState } from 'react'
import PubSub from 'pubsub-js'
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import IconButton from '@mui/material/IconButton'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import { AudioUtil } from '../../audio/components/audio_util'
import { VideoUtil } from '../../video/components/video_util'

const TinyText = styled(Typography)({
  fontSize: '0.75rem',
  opacity: 0.38,
  fontWeight: 500,
  letterSpacing: 0.2,
});

export default function MusicPlayerSlider(props) {
  const theme  = useTheme()
  const [max, setMax] = useState(0) // seconds
  const [position, setPosition] = useState(0)
  const [paused, setPaused] = useState(false)

  const mySubscriber = (msg, data) => {
    if (msg == 'POSITION') {
      setPosition(Math.floor(data.position))
    } else if (msg == "MAX") {
      setMax(data.max)
    } else if (msg == "RUNNING") {
      VideoUtil.running = data
    }
  }

  useEffect(() => {
    //--- Set up pubsub for global events ---//
    const token1 = PubSub.subscribe('POSITION', mySubscriber) // tokens needed to cancel sub
    const token2 = PubSub.subscribe('MAX', mySubscriber)
    const token3 = PubSub.subscribe('RUNNING', mySubscriber)
  }, [])

  const togglePlay = () => {
    if (!paused) { // !paused, so stop video
      setPaused(!paused)
      VideoUtil.renderer.setAnimationLoop(null)
      const now = performance.now() / 1000.0
      VideoUtil.clock.stopTime = now
      VideoUtil.clock.activeTime += VideoUtil.clock.stopTime - VideoUtil.clock.startTime
      // PubSub.publish('RUNNING', {isRunning: false})
    } else { // paused, so start video
      setPaused(!paused)
      VideoUtil.renderer.setAnimationLoop(VideoUtil.drawFrame)
      const now = performance.now() / 1000.0
      VideoUtil.clock.startTime = now
      VideoUtil.clock.inactiveTime += VideoUtil.clock.startTime - VideoUtil.clock.stopTime
      // PubSub.publish('RUNNING', {isRunning: true})
    }
  }

  const debounce = (func, timeout = 300) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    }
  }
  const debouncedJumpToPosition = debounce((value) => jumpToPosition(value), 250)
  const jumpToPosition = (value) => {
    setPosition(value)
    console.log("JUMPING TO:", value)
    const now = value // VideoUtil.clock.getElapsedTime()
    // VideoUtil.eventStream.setSortedEvents()
    VideoUtil.eventStream.computeCurrPtr(now)
    VideoUtil.eventStream.cacheActive(Math.max(0, now -2), now + 5)
  }

  const formatDuration = (value) => {
    const minute = Math.floor(value / 60)
    const secondLeft = value - minute * 60
    return `${minute}:${secondLeft < 9 ? `0${secondLeft}` : secondLeft}`
  }
  const mainIconColor = theme.palette.mode === 'dark' ? '#fff' : '#000'

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Slider
        aria-label="time-indicator"
        size="small"
        value={position}
        min={0}
        step={0.01}
        max={max}
        onChange={(_, value) => debouncedJumpToPosition(value)}
        sx={{
          color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0,0,0,0.87)',
          height: 4,
          '& .MuiSlider-thumb': {
            width: 8,
            height: 8,
            transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
            '&:before': {
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
            },
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0px 0px 0px 8px ${theme.palette.mode === 'dark'
                ? 'rgb(255 255 255 / 16%)'
                : 'rgb(0 0 0 / 16%)'
                }`,
            },
            '&.Mui-active': {
              width: 20,
              height: 20,
            },
          },
          '& .MuiSlider-rail': {
            opacity: 0.28,
          },
        }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: -2,
        }}
      >
        <TinyText>{formatDuration(position)}</TinyText>
        {/* <TinyText>-{formatDuration(duration - position)}</TinyText> */}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: -1,
        }}
      >
        <IconButton
          aria-label={paused ? 'play' : 'pause'}
          onClick={() => togglePlay()}
        >
          {paused ? (
            <PlayArrowRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
          ) : (
            <PauseRounded sx={{ fontSize: '3rem' }} htmlColor={mainIconColor} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}