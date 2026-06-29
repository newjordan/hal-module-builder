import React, { useState, useRef, useEffect } from 'react';
import { GeneratedAudio } from '../../services/GeneratedAudioDB';

interface GeneratedAudioListProps {
  audioList: GeneratedAudio[];
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  theme: 'frost_light' | 'frost_dark';
}

const GeneratedAudioList: React.FC<GeneratedAudioListProps> = ({
  audioList,
  onDelete,
  onUpdateName,
  theme,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const isDark = theme === 'frost_dark';

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayingId(null);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = (audio: GeneratedAudio) => {
    if (playingId === audio.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (playingId === audio.id) {
      audioRef.current?.play();
      setIsPlaying(true);
    } else {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const blob = new Blob([audio.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setPlayingId(audio.id);
      setCurrentTime(0);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = (audio: GeneratedAudio) => {
    const blob = new Blob([audio.data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audio.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      onUpdateName(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const filteredAudioList = audioList.filter(audio =>
    audio.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`frost-space-y-4 ${isDark ? 'frostdark-standard-glass-card' : 'frostlight-standard-glass-card'} frost-p-4 frost-rounded`}>
      <h4 className={`frost-text-lg frost-font-medium frost-mb-2 ${isDark ? 'frost-text-gray-200' : 'frost-text-gray-800'}`}>
        Saved Audio
      </h4>

      {/* Search Input */}
      <div className={isDark ? 'frostdark-input-container' : 'frostlight-input-container'}>
        <input
          type='text'
          placeholder='Search saved audio...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={isDark ? 'frostdark-input-field' : 'frostlight-input-field'}
        />
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {filteredAudioList.length === 0 ? (
        <div className={`frost-p-4 frost-text-center frost-opacity-60 frost-text-sm ${isDark ? 'frost-text-gray-300' : 'frost-text-gray-600'}`}>
          {audioList.length > 0 ? 'No matches found.' : 'No audio generated yet.'}
        </div>
      ) : (
        <div className='frost-space-y-2'>
          {filteredAudioList.map(audio => (
            <div
              key={audio.id}
              className={`frost-p-3 frost-rounded ${isDark ? 'frostdark-standard-glass-card' : 'frostlight-standard-glass-card'}`}
            >
              {editingId === audio.id ? (
                <div className='frost-flex frost-items-center frost-gap-2'>
                  <div className={`frost-flex-1 ${isDark ? 'frostdark-input-container' : 'frostlight-input-container'}`}>
                    <input
                      type='text'
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(audio.id)}
                      className={isDark ? 'frostdark-input-field' : 'frostlight-input-field'}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => handleRename(audio.id)}
                    className={`${isDark ? 'frostdark-button-action' : 'frostlight-button-action'} ${isDark ? 'frostdark-button-action-sm' : 'frostlight-button-action-sm'}`}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className={`${isDark ? 'frostdark-button-action-danger' : 'frostlight-button-action-danger'} ${isDark ? 'frostdark-button-action-sm' : 'frostlight-button-action-sm'}`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  {/* Audio info header */}
                  <div className='frost-flex frost-items-center frost-justify-between frost-mb-2'>
                    <span className={`frost-text-sm frost-font-medium ${isDark ? 'frost-text-gray-200' : 'frost-text-gray-800'}`}>
                      {audio.name}
                    </span>
                    <span className={`frost-text-xs ${isDark ? 'frost-text-gray-400' : 'frost-text-gray-500'}`}>
                      {new Date(audio.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Audio player controls */}
                  {playingId === audio.id && (
                    <div className='frost-mb-3 frost-space-y-2'>
                      <div className='frost-flex frost-items-center frost-gap-2'>
                        <span className={`frost-text-xs ${isDark ? 'frost-text-gray-400' : 'frost-text-gray-600'}`}>
                          {formatTime(currentTime)}
                        </span>
                        <input
                          type='range'
                          min='0'
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className={`frost-flex-1 ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
                        />
                        <span className={`frost-text-xs ${isDark ? 'frost-text-gray-400' : 'frost-text-gray-600'}`}>
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className='frost-flex frost-items-center frost-gap-2 frost-flex-wrap'>
                    <button
                      onClick={() => handlePlayPause(audio)}
                      className={`${isDark ? 'frostdark-button-action' : 'frostlight-button-action'} ${isDark ? 'frostdark-button-action-sm' : 'frostlight-button-action-sm'}`}
                    >
                      {playingId === audio.id && isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(audio.id);
                        setEditingName(audio.name);
                      }}
                      className={`${isDark ? 'frostdark-button-action' : 'frostlight-button-action'} ${isDark ? 'frostdark-button-action-sm' : 'frostlight-button-action-sm'}`}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDownload(audio)}
                      className={`${isDark ? 'frostdark-button-action' : 'frostlight-button-action'} ${isDark ? 'frostdark-button-action-sm' : 'frostlight-button-action-sm'}`}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => onDelete(audio.id)}
                      className={`${isDark ? 'frostdark-button-action-danger' : 'frostlight-button-action-danger'} ${isDark ? 'frostdark-button-action-sm' : 'frostlight-button-action-sm'}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratedAudioList;
