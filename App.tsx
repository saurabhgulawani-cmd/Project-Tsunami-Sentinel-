
import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } from 'react';
import { fetchTsunamiData } from './services/tsunamiService';
import { EarthquakeEvent, AlertSettings, GeneratedAlert } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

// --- THEME MANAGEMENT ---
const ThemeContext = createContext<{ theme: string; toggleTheme: () => void; } | undefined>(undefined);

const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useLocalStorage('theme', 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// --- ICONS ---
const RefreshIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12z" />
  </svg>
);

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);


// --- UTILITY FUNCTIONS ---
const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} minutes ago`;
  return `${Math.floor(seconds)} seconds ago`;
};

const formatDateTime = (date: Date): string => {
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-US', { hour12: false })}`;
};

const getMagnitudeClass = (magnitude: number): string => {
  if (magnitude >= 7.5) return 'bg-danger/20 text-danger border-danger/50';
  if (magnitude >= 6.0) return 'bg-warning/20 text-warning border-warning/50';
  return 'bg-gray-200 dark:bg-sentinel-border text-gray-600 dark:text-sentinel-text-secondary border-gray-300 dark:border-sentinel-border';
};

// --- SUB-COMPONENTS ---
const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border text-gray-600 dark:text-sentinel-text-secondary hover:bg-gray-200 dark:hover:bg-sentinel-border"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
    );
};

const Header: React.FC<{ onRefresh: () => void, loading: boolean }> = ({ onRefresh, loading }) => (
    <header className="grid grid-cols-3 items-center p-4 border-b border-gray-200 dark:border-sentinel-border">
        <div></div>
        <div className="flex flex-col items-center col-start-2">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4CB3D1"/>
                        <stop offset="1" stopColor="#2D5F9E"/>
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" className="fill-white dark:fill-sentinel-body stroke-gray-200 dark:stroke-sentinel-border" strokeWidth="4"/>
                <path d="M20 60 C 35 40, 50 40, 65 60 C 80 80, 95 80, 95 60" stroke="url(#waveGradient)" strokeWidth="8" strokeLinecap="round" fill="none"/>
                <path d="M20 45 C 35 25, 50 25, 65 45 C 80 65, 95 65, 95 45" stroke="url(#waveGradient)" strokeWidth="8" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
            </svg>
            <h1 className="text-3xl font-extrabold tracking-wider text-gray-900 dark:text-sentinel-text-primary mt-2">TSUNAMI SENTINEL</h1>
            <p className="text-sm text-gray-500 dark:text-sentinel-text-secondary">Real-time Monitoring System</p>
        </div>
        <div className="col-start-3 justify-self-end flex items-center space-x-2">
            <ThemeToggleButton />
            <button onClick={onRefresh} disabled={loading} className="flex items-center px-4 py-2 space-x-2 text-sm font-semibold transition-colors border rounded-md bg-white dark:bg-sentinel-body border-gray-200 dark:border-sentinel-border text-gray-800 dark:text-sentinel-text-primary hover:bg-gray-100 dark:hover:bg-sentinel-border disabled:opacity-50 disabled:cursor-not-allowed">
                <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
            </button>
        </div>
    </header>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="p-4 rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border">
        <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-sentinel-text-secondary">{title}</p>
            <div className={colorClass}>{icon}</div>
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-sentinel-text-primary">{value}</p>
        <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">
          {title === 'Active Alerts' ? 'All clear' : title === 'High Priority' ? 'Severe or extreme alerts' : 'M6.0+ in last 24 hours'}
        </p>
    </div>
);

const convertCoordsToPixels = (lat: number, lon: number, width: number, height: number) => {
    // Simple equirectangular projection
    const x = (lon + 180) * (width / 360);
    const y = (90 - lat) * (height / 180);
    return { x, y };
};

const worldMapImageUrl = "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg";
const lightMapImageUrl = "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg";

const EarthquakeMapCard: React.FC<{ events: EarthquakeEvent[] }> = ({ events }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const { theme } = useTheme();

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    const points = useMemo(() => {
        if (dimensions.width === 0) return [];
        return events.map(event => {
            const { x, y } = convertCoordsToPixels(event.lat, event.lon, dimensions.width, dimensions.height);
            return {
                ...event,
                x,
                y,
                size: Math.max(5, (event.magnitude - 5.5) * 7),
                color: event.magnitude >= 7.5 ? '#f85149' : event.magnitude >= 6.5 ? '#f5a623' : '#FFD54F'
            };
        });
    }, [events, dimensions]);

    return (
        <div ref={containerRef} className="rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border aspect-video w-full relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${theme === 'dark' ? worldMapImageUrl : lightMapImageUrl})` }}>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.7; }
                    100% { transform: scale(3); opacity: 0; }
                }
            `}</style>
             {points.map(point => (
                <div
                    key={point.id}
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${point.x}px`, top: `${point.y}px` }}
                    title={`Magnitude: ${point.magnitude.toFixed(1)}\nLocation: ${point.location}\nDepth: ${point.depth.toFixed(1)} km\nTime: ${formatDateTime(point.updated)}`}
                >
                    <div
                        className="relative rounded-full"
                        style={{
                            width: `${point.size}px`,
                            height: `${point.size}px`,
                            backgroundColor: point.color,
                            opacity: 0.8,
                            boxShadow: `0 0 ${point.size}px ${point.color}`,
                        }}
                    ></div>
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            border: `2px solid ${point.color}`,
                            animation: `pulse 2s infinite ease-out`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    ></div>
                </div>
            ))}
        </div>
    );
};


const LatestEarthquakeCard: React.FC<{ event: EarthquakeEvent | null }> = ({ event }) => {
    if (!event) {
        return <div className="p-6 text-center rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border text-gray-500 dark:text-sentinel-text-secondary">No significant earthquake data available.</div>;
    }

    return (
        <div className="p-6 rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-sentinel-text-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Latest Significant Earthquake
                </h2>
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getMagnitudeClass(event.magnitude)}`}>
                    M{event.magnitude.toFixed(1)}
                </span>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
                <div className="col-span-1 md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">Location</p>
                    <p className="font-semibold text-gray-800 dark:text-sentinel-text-primary">{event.location}</p>
                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">{event.lat.toFixed(4)}°, {event.lon.toFixed(4)}°</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">Time</p>
                    <p className="font-semibold text-gray-800 dark:text-sentinel-text-primary">{timeAgo(event.updated)}</p>
                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">{formatDateTime(event.updated)}</p>
                </div>
            </div>
             <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                <div>
                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">Magnitude</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-sentinel-text-primary">{event.magnitude.toFixed(1)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">Depth</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-sentinel-text-primary">{event.depth.toFixed(1)} <span className="text-lg text-gray-500 dark:text-sentinel-text-secondary">km</span></p>
                </div>
            </div>
            {event.isTsunamiWarning && (
                <div className="p-3 mb-4 rounded-md bg-danger/20 text-danger">
                    <p className="font-bold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.75a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3z" clipRule="evenodd" /></svg>
                        Tsunami Warning Possible
                    </p>
                </div>
            )}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-sentinel-text-secondary">
                <div className="flex items-center space-x-4">
                    <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-sentinel-accent hover:underline">
                        View Official Bulletin &rarr;
                    </a>
                    <span className="text-gray-300 dark:text-sentinel-border">|</span>
                    <a href="https://www.tsunami.gov/" target="_blank" rel="noopener noreferrer" className="text-sentinel-accent hover:underline">
                        Check tsunami.gov
                    </a>
                </div>
                <span>Event ID: {event.id.split(':').pop()?.split(',')[0] || 'N/A'}</span>
            </div>
        </div>
    );
};

const RecentEarthquakesCard: React.FC<{ events: EarthquakeEvent[] }> = ({ events }) => {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const handleToggle = (eventId: string) => {
        setSelectedEventId(prevId => (prevId === eventId ? null : eventId));
    };

    return (
        <div className="p-6 rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-sentinel-text-primary mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Recent Earthquakes (M6.0+)
            </h2>
            <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-sentinel-border scrollbar-track-gray-100 dark:scrollbar-track-sentinel-body">
                {events.length > 0 ? (
                    <div className="relative border-l-2 border-gray-200 dark:border-sentinel-border space-y-4 ml-2">
                        {events.map((event) => (
                            <div key={event.id} className="pl-6 relative">
                                <div className="absolute -left-[7px] top-1.5 w-3 h-3 bg-gray-500 dark:bg-sentinel-text-secondary rounded-full border-2 border-white dark:border-sentinel-body"></div>
                                <div className="cursor-pointer" onClick={() => handleToggle(event.id)}>
                                    <div className="flex justify-between items-start text-xs text-gray-500 dark:text-sentinel-text-secondary mb-1">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getMagnitudeClass(event.magnitude)}`}>
                                            M{event.magnitude.toFixed(1)}
                                        </span>
                                        <span>{timeAgo(event.updated)}</span>
                                    </div>
                                    <p className="font-semibold text-gray-800 dark:text-sentinel-text-primary">{event.location}</p>
                                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">Depth: {event.depth.toFixed(1)} km &middot; {event.lat.toFixed(2)}°, {event.lon.toFixed(2)}°</p>
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedEventId === event.id ? 'max-h-40 mt-2' : 'max-h-0'}`}>
                                    <div className="p-3 bg-gray-50 dark:bg-sentinel-dark rounded-md text-xs space-y-1 border border-gray-200 dark:border-sentinel-border">
                                        <p><span className="font-semibold text-gray-600 dark:text-sentinel-text-secondary">Full Title:</span> {event.title}</p>
                                        <p><span className="font-semibold text-gray-600 dark:text-sentinel-text-secondary">Time:</span> {formatDateTime(event.updated)}</p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-sentinel-accent hover:underline font-bold">
                                                View Official Bulletin &rarr;
                                            </a>
                                            <span className="text-gray-300 dark:text-sentinel-border">|</span>
                                            <a href="https://www.tsunami.gov/" target="_blank" rel="noopener noreferrer" className="text-sentinel-accent hover:underline font-bold">
                                                Check tsunami.gov
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-sentinel-text-secondary">No recent earthquakes (M6.0+) to display.</p>
                )}
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-sentinel-text-secondary">Showing {events.length} earthquakes</p>
        </div>
    );
};

const TsunamiAlertsCard: React.FC<{ events: EarthquakeEvent[] }> = ({ events }) => {
    const activeAlerts = events.filter(e => e.alertLevel !== 'none' && e.alertLevel !== 'info');
    return (
        <div className="p-6 rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-sentinel-text-primary mb-4 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Tsunami Alerts
            </h2>
            {activeAlerts.length > 0 ? (
                <div className="space-y-3">
                    {activeAlerts.map(alert => (
                         <div key={alert.id} className="p-3 rounded-md bg-danger/20 text-danger border border-danger/50">
                            <p className="font-bold uppercase text-sm">{alert.alertLevel}</p>
                            <p className="text-xs">{alert.title}</p>
                            <a href={alert.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:underline mt-1 inline-block">View Alert &rarr;</a>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-sentinel-text-secondary py-8">No alerts at this time</p>
            )}
        </div>
    );
};

const EmailSettingsCard: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<AlertSettings>('alertSettings', {
        minMagnitude: 7.0,
        notificationsEnabled: true,
        recipients: ['example@email.com'],
        emailTemplate: 'ALERT: A magnitude {magnitude} earthquake occurred near {location} at {time}. More details: {link}',
    });
    const [newRecipient, setNewRecipient] = useState('');

    const handleAddRecipient = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRecipient && !settings.recipients.includes(newRecipient)) {
            setSettings(s => ({ ...s, recipients: [...s.recipients, newRecipient] }));
            setNewRecipient('');
        }
    };

    const handleRemoveRecipient = (recipientToRemove: string) => {
        setSettings(s => ({ ...s, recipients: s.recipients.filter(r => r !== recipientToRemove) }));
    };
    
    return (
        <div className="p-6 rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-sentinel-text-primary mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Alert Configuration
            </h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-800 dark:text-sentinel-text-primary">Enable Email Alerts</label>
                    <button
                        onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.notificationsEnabled ? 'bg-sentinel-accent' : 'bg-gray-300 dark:bg-sentinel-border'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <fieldset className="space-y-4 disabled:opacity-50" disabled={!settings.notificationsEnabled}>
                    <div>
                        <label htmlFor="min-magnitude" className="block text-sm font-medium text-gray-500 dark:text-sentinel-text-secondary">Min. Magnitude: <span className="font-bold text-gray-800 dark:text-sentinel-text-primary">{settings.minMagnitude.toFixed(1)}</span></label>
                        <input
                            id="min-magnitude" type="range" min="6.0" max="9.0" step="0.1"
                            value={settings.minMagnitude}
                            onChange={(e) => setSettings(s => ({ ...s, minMagnitude: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 dark:bg-sentinel-border rounded-lg appearance-none cursor-pointer accent-sentinel-accent"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-sentinel-text-secondary mb-1">Alert Recipients</label>
                        <form onSubmit={handleAddRecipient} className="flex items-center space-x-2">
                             <input type="email" placeholder="Add email address" value={newRecipient} onChange={e => setNewRecipient(e.target.value)} className="w-full bg-gray-100 dark:bg-sentinel-dark border border-gray-300 dark:border-sentinel-border text-gray-800 dark:text-sentinel-text-primary text-sm rounded-md p-2" />
                             <button type="submit" className="p-2 bg-sentinel-info rounded-md hover:bg-sentinel-accent shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                             </button>
                        </form>
                        <div className="mt-2 space-y-1">
                            {settings.recipients.map(r => (
                                <div key={r} className="flex justify-between items-center bg-gray-100 dark:bg-sentinel-dark p-1.5 pl-3 rounded-md text-sm">
                                    <span className="text-gray-800 dark:text-sentinel-text-primary">{r}</span>
                                    <button onClick={() => handleRemoveRecipient(r)} className="text-gray-400 dark:text-sentinel-text-secondary hover:text-danger p-1 rounded-full">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="email-template" className="block text-sm font-medium text-gray-500 dark:text-sentinel-text-secondary">Email Body Template</label>
                        <textarea
                            id="email-template"
                            rows={4}
                            value={settings.emailTemplate}
                            onChange={(e) => setSettings(s => ({ ...s, emailTemplate: e.target.value }))}
                            className="w-full bg-gray-100 dark:bg-sentinel-dark border border-gray-300 dark:border-sentinel-border text-gray-800 dark:text-sentinel-text-primary text-sm rounded-md p-2 mt-1"
                        ></textarea>
                        <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary mt-1">
                            Use placeholders: {`{magnitude}`}, {`{location}`}, {`{depth}`}, {`{time}`}, {`{link}`}
                        </p>
                    </div>
                </fieldset>
            </div>
        </div>
    );
};

const GeneratedAlertsCard: React.FC<{ alerts: GeneratedAlert[] }> = ({ alerts }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="p-6 rounded-lg bg-white dark:bg-sentinel-body border border-gray-200 dark:border-sentinel-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-sentinel-text-primary mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 8.586V3a1 1 0 10-2 0v5.586L8.707 7.293zM3 9a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /><path d="M3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                Generated Email Alerts
            </h2>
             <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-sentinel-border scrollbar-track-gray-100 dark:scrollbar-track-sentinel-body space-y-3">
                 {alerts.length > 0 ? (
                     alerts.map(alert => (
                        <div key={alert.id} className="bg-gray-50 dark:bg-sentinel-dark p-3 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-sm text-gray-800 dark:text-sentinel-text-primary">M{alert.event.magnitude.toFixed(1)} - {alert.event.location}</p>
                                    <p className="text-xs text-gray-500 dark:text-sentinel-text-secondary">Generated: {formatDateTime(new Date(alert.timestamp))}</p>
                                </div>
                                <button
                                    onClick={() => handleCopy(alert.body, alert.id)}
                                    className="text-xs bg-sentinel-info text-white px-2 py-1 rounded-md hover:bg-sentinel-accent transition-colors"
                                >
                                    {copiedId === alert.id ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-sentinel-darker p-2 rounded whitespace-pre-wrap font-mono text-gray-600 dark:text-sentinel-text-secondary">{alert.body}</pre>
                        </div>
                     ))
                 ) : (
                    <p className="text-center text-gray-500 dark:text-sentinel-text-secondary py-8">No alerts generated yet.</p>
                 )}
            </div>
        </div>
    );
};


const Footer: React.FC = () => (
    <footer className="text-center p-4 mt-4 text-xs text-gray-500 dark:text-sentinel-text-secondary border-t border-gray-200 dark:border-sentinel-border">
        Data sourced from NOAA/NWS Tsunami Warning Centers. For more information, visit{' '}
        <a href="https://www.tsunami.gov/" target="_blank" rel="noopener noreferrer" className="text-sentinel-accent hover:underline">
            tsunami.gov
        </a>.
    </footer>
);


// --- MAIN APP COMPONENT ---
function TsunamiDashboard() {
    const [events, setEvents] = useState<EarthquakeEvent[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [alertSettings] = useLocalStorage<AlertSettings>('alertSettings', {
        minMagnitude: 7.0, notificationsEnabled: true, recipients: [], emailTemplate: 'ALERT: A magnitude {magnitude} earthquake occurred near {location} at {time}. More details: {link}'
    });
    const [processedEvents, setProcessedEvents] = useLocalStorage<string[]>('processedEvents', []);
    const [generatedAlerts, setGeneratedAlerts] = useLocalStorage<GeneratedAlert[]>('generatedAlerts', []);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const data = await fetchTsunamiData();
            setEvents(data);
        } catch (err) {
            setError('Failed to fetch data. Please try again later.');
            console.error(err);
            throw err;
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await loadData();
        } catch (e) {
            // Error is already set within loadData
        } finally {
            setIsRefreshing(false);
        }
    }, [loadData, isRefreshing]);

    useEffect(() => {
        const initialFetch = async () => {
            try {
                await loadData();
            } catch (e) {
                // Error is set, initial load will fail and show error message
            } finally {
                setIsInitialLoad(false);
            }
        };
        initialFetch();
    }, [loadData]);

    useEffect(() => {
        if (!alertSettings.notificationsEnabled || alertSettings.recipients.length === 0 || events.length === 0) {
            return;
        }

        const newProcessed = new Set(processedEvents);
        const newAlerts: GeneratedAlert[] = [];
        
        events.forEach(event => {
            if (newProcessed.has(event.id)) {
                return; // Already processed this event
            }
            
            if (event.magnitude >= alertSettings.minMagnitude) {
                const body = alertSettings.emailTemplate
                    .replace('{magnitude}', event.magnitude.toFixed(1))
                    .replace('{location}', event.location)
                    .replace('{depth}', event.depth.toFixed(1) + ' km')
                    .replace('{time}', formatDateTime(event.updated))
                    .replace('{link}', event.link);

                const newAlert: GeneratedAlert = {
                    id: `${event.id}-${new Date().toISOString()}`,
                    timestamp: new Date().toISOString(),
                    event,
                    body,
                };
                newAlerts.push(newAlert);
                newProcessed.add(event.id);
            }
        });

        if (newAlerts.length > 0) {
            setGeneratedAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
            setProcessedEvents(Array.from(newProcessed));
        }

    }, [events, alertSettings, processedEvents, setProcessedEvents, setGeneratedAlerts]);


    const {
        activeAlerts,
        highPriorityAlerts,
        twentyFourHourQuakes,
        latestSignificant,
        recentM6PlusQuakes
    } = useMemo(() => {
        const now = new Date();
        const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);

        const activeAlerts = events.filter(e => e.alertLevel === 'watch' || e.alertLevel === 'warning' || e.alertLevel === 'advisory');
        const highPriorityAlerts = events.filter(e => e.alertLevel === 'warning');
        const twentyFourHourQuakes = events.filter(e => e.updated.getTime() > twentyFourHoursAgo && e.magnitude >= 6.0);
        const recentM6PlusQuakes = events.filter(e => e.magnitude >= 6.0).slice(0, 10);
        
        return {
            activeAlerts: activeAlerts.length,
            highPriorityAlerts: highPriorityAlerts.length,
            twentyFourHourQuakes: twentyFourHourQuakes.length,
            latestSignificant: events.length > 0 ? events[0] : null,
            recentM6PlusQuakes
        }
    }, [events]);
    
    if (isInitialLoad) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-sentinel-dark text-gray-800 dark:text-sentinel-text-primary font-sans flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <RefreshIcon className="w-10 h-10 animate-spin text-sentinel-accent" />
                    <h1 className="text-xl text-gray-500 dark:text-sentinel-text-secondary">Loading Initial Data...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-sentinel-dark text-gray-800 dark:text-sentinel-text-primary font-sans transition-colors duration-300">
            <Header onRefresh={handleRefresh} loading={isRefreshing} />
            {error && <div className="p-4 m-4 text-center text-danger bg-danger/20 rounded-md">{error}</div>}
            <main className="p-4 lg:p-6">
                 <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Active Alerts" value={activeAlerts} colorClass="text-sentinel-accent" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} />
                    <StatCard title="High Priority" value={highPriorityAlerts} colorClass="text-danger" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                    <StatCard title="24hr Earthquakes" value={twentyFourHourQuakes} colorClass="text-warning" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <LatestEarthquakeCard event={latestSignificant} />
                        <EarthquakeMapCard events={recentM6PlusQuakes} />
                        <RecentEarthquakesCard events={recentM6PlusQuakes} />
                    </div>
                    <div className="flex flex-col gap-4">
                        <TsunamiAlertsCard events={events} />
                        <EmailSettingsCard />
                        <GeneratedAlertsCard alerts={generatedAlerts} />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <TsunamiDashboard />
        </ThemeProvider>
    );
}