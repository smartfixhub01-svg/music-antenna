import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from "react";

import { supabase } from "./lib/supabase";
import "./App.css";

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return seconds + "s ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + "d ago";
  const months = Math.floor(days / 30);
  if (months < 12) return months + "mo ago";
  const years = Math.floor(days / 365);
  return years + "y ago";
}


const BUCKET = "music-antenna-media";

export default function App() {



  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState("listener");
  const [justTriedRegister, setJustTriedRegister] = useState(false);
  const [authTab, setAuthTab] = useState("listener");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCreatorResetModal, setShowCreatorResetModal] = useState(false);
  const [creatorResetEmail, setCreatorResetEmail] = useState("");

  const [showResetPasswordScreen, setShowResetPasswordScreen] = useState(false);
  
  
  
  

  useEffect(() => {
    
  

  }, [showResetPasswordScreen]);


  // Force stop all media when the password reset screen is active
  useEffect(() => {
    
  }, [showResetPasswordScreen]);

  const [resetEmail, setResetEmail] = useState("");
  const [theme, setTheme] = useState("device");
  
  // Dynamically update the mobile status bar color based on the theme
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const color = isDark ? '#0f0f0f' : '#ffffff'; // Black for dark, White for light
    
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }, [theme]);



  useEffect(() => {
    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'device') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
    };
    
    applyTheme();
    localStorage.setItem('ma_theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (theme === 'device') applyTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const messageTimeoutRef = useRef(null);

  useEffect(() => {
    if (message) {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setMessage(""), 3000);
    }
  }, [message]);

  const [media, setMedia] = useState([]);
  const [feedLimit, setFeedLimit] = useState(15);
  const [feedLoading, setFeedLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchStatusMsg, setSearchStatusMsg] = useState("");
  const [searchSummary, setSearchSummary] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    let lastNavScrollY = window.scrollY;
    let ticking = false;

    const handleNavScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY < 40 || currentY < lastNavScrollY - 5) {
          setNavVisible(true);
        } else if (currentY > lastNavScrollY + 5) {
          setNavVisible(false);
        }
        lastNavScrollY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleNavScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleNavScroll);
  }, []);

  const [category, setCategory] = useState("All");
  const [activeMedia, setActiveMedia] = useState(null);
  const [showWatchPage, setShowWatchPage] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [miniPlayerPos, setMiniPlayerPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 1000);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

  const handlePointerDown = (e) => {
    if (e.target.closest('button')) return; // Don't drag if clicking a button
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    let newLeft = dragRef.current.initialLeft + dx;
    let newTop = dragRef.current.initialTop + dy;

    const el = e.currentTarget;
    if (el) {
      // Force a hard 0px boundary so it never goes off-screen
      const maxLeft = window.innerWidth - el.offsetWidth;
      const maxTop = window.innerHeight - el.offsetHeight;
      
      newLeft = Math.max(0, Math.min(maxLeft, newLeft));
      newTop = Math.max(0, Math.min(maxTop, newTop));

      el.style.transform = `translate3d(${newLeft - dragRef.current.initialLeft}px, ${newTop - dragRef.current.initialTop}px, 0)`;
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    let newLeft = dragRef.current.initialLeft + dx;
    let newTop = dragRef.current.initialTop + dy;

    const el = e.currentTarget;
    if (el) {
      const maxLeft = window.innerWidth - el.offsetWidth;
      const maxTop = window.innerHeight - el.offsetHeight;
      newLeft = Math.max(0, Math.min(maxLeft, newLeft));
      newTop = Math.max(0, Math.min(maxTop, newTop));
      
      el.style.transform = ''; 
      setMiniPlayerPos({ left: newLeft, top: newTop });
    }
  };

const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [videoQuality, setVideoQuality] = useState("Auto");
  const [showDescModal, setShowDescModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({ totalViews: 0, totalSubs: 0, totalComments: 0, weeklyViews: 0, weeklySubs: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [mySubCount, setMySubCount] = useState(0);
  const [profileTab, setProfileTab] = useState("overview");
  const [showUpload, setShowUpload] = useState(false);
  const [showManagePage, setShowManagePage] = useState(false);
  const [manageSource, setManageSource] = useState("account");
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddVideoToPlaylistModal, setShowAddVideoToPlaylistModal] = useState(false);
  const [mediaPickerItems, setMediaPickerItems] = useState([]);
  const [mediaPickerLoading, setMediaPickerLoading] = useState(false);
  const [playlistActionMessage, setPlaylistActionMessage] = useState("");
  const [addingMediaId, setAddingMediaId] = useState(null);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState(null);
  const [addedPlaylistTitle, setAddedPlaylistTitle] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistDetailPage, setShowPlaylistDetailPage] = useState(false);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [selectedPlaylistItems, setSelectedPlaylistItems] = useState([]);
  const [activePlaylistItemMenu, setActivePlaylistItemMenu] = useState(null);
  const [playlistCoverFile, setPlaylistCoverFile] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [videoQueue, setVideoQueue] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [showAllPlaylists, setShowAllPlaylists] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [playlistDetailSearch, setPlaylistDetailSearch] = useState("");
  const [showPlaylistDetailMenu, setShowPlaylistDetailMenu] = useState(false);
  const [playlistDetailSort, setPlaylistDetailSort] = useState("newest");

  const visiblePlaylistItems = [...playlistItems]
    .filter((item) => {
      const query = playlistDetailSearch.trim().toLowerCase();
      if (!query) return true;
      return [
        item.title,
        item.description,
        item.profiles?.display_name,
        item.media_type
      ].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (playlistDetailSort === "title") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      if (playlistDetailSort === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  const [playlistSort, setPlaylistSort] = useState("newest");
  const [showEditPlaylistModal, setShowEditPlaylistModal] = useState(false);
  const [editPlaylistTitle, setEditPlaylistTitle] = useState("");
  const [editPlaylistDescription, setEditPlaylistDescription] = useState("");
  const [editPlaylistVisibility, setEditPlaylistVisibility] = useState("public");
  const [isSavingPlaylistEdit, setIsSavingPlaylistEdit] = useState(false);

  const visiblePlaylists = playlists
    .filter((pl) => (pl.title || "").toLowerCase().includes(playlistSearch.trim().toLowerCase()))
    .sort((a, b) => {
      if (playlistSort === "title") return (a.title || "").localeCompare(b.title || "");
      if (playlistSort === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const [showLikedPage, setShowLikedPage] = useState(false);
  const [likedMedia, setLikedMedia] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);

  const [manageMedia, setManageMedia] = useState([]);
  const [manageSearch, setManageSearch] = useState("");
  const [manageLoading, setManageLoading] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  
  // Edit Form States
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [editAllowDownload, setEditAllowDownload] = useState(false);
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [showSubscriptionsFeed, setShowSubscriptionsFeed] = useState(false);
  const [showSubscriptionsPage, setShowSubscriptionsPage] = useState(false);
  const [subsPageTab, setSubsPageTab] = useState("subbers");
  const [subbersList, setSubbersList] = useState([]);
  const [subsList, setSubsList] = useState([]);
  const [subsPageLoading, setSubsPageLoading] = useState(false);
  const [subsPageError, setSubsPageError] = useState("");
  const [subsRefreshTrigger, setSubsRefreshTrigger] = useState(0);
  const [subsSearch, setSubsSearch] = useState("");
  const [subsSort, setSubsSort] = useState("newest");
  const [unsubscribingId, setUnsubscribingId] = useState(null);


  useEffect(() => {
    if (!showSubscriptionsPage || !session?.user?.id) return;
    setSubsPageLoading(true);
    setSubsPageError("");
    
    const fetchData = async () => {
      try {
        const { data: subbersData, error: subbersErr } = await supabase.from("subscriptions")
          .select("subscriber_id, created_at")
          .eq("channel_id", session.user.id)
          .order("created_at", { ascending: false });

        if (subbersErr) throw subbersErr;

        if (subbersData && subbersData.length > 0) {
          const subberIds = subbersData.map(d => d.subscriber_id);
          const { data: profiles, error: pErr } = await supabase.from("profiles")
            .select("id, username, display_name, avatar_url, role")
            .in("id", subberIds);
          
          if (pErr) throw pErr;
          
          const profileMap = {};
          (profiles || []).forEach(p => { profileMap[p.id] = p; });
          
          setSubbersList(subbersData.map(d => ({
            created_at: d.created_at,
            profile: profileMap[d.subscriber_id] || null
          })).filter(x => x.profile));
        } else {
          setSubbersList([]);
        }

        const { data: subsData, error: subsErr } = await supabase.from("subscriptions")
          .select("channel_id, created_at")
          .eq("subscriber_id", session.user.id)
          .order("created_at", { ascending: false });

        if (subsErr) throw subsErr;

        if (subsData && subsData.length > 0) {
          const channelIds = subsData.map(d => d.channel_id);
          const { data: profiles, error: pErr } = await supabase.from("profiles")
            .select("id, username, display_name, avatar_url, role")
            .in("id", channelIds);
          
          if (pErr) throw pErr;
          
          const profileMap = {};
          (profiles || []).forEach(p => { profileMap[p.id] = p; });
          
          setSubsList(subsData.map(d => ({
            created_at: d.created_at,
            profile: profileMap[d.channel_id] || null
          })).filter(x => x.profile));
        } else {
          setSubsList([]);
        }
      } catch (err) {
        setSubsPageError(err.message || "Failed to load subscriptions.");
      } finally {
        setSubsPageLoading(false);
      }
    };
    fetchData();
  }, [showSubscriptionsPage, session?.user?.id, subsRefreshTrigger]);


  const [subsTab, setSubsTab] = useState("feed");
  const [mySubscribers, setMySubscribers] = useState([]);

  useEffect(() => {
    if (showSubscriptionsFeed && subsTab === "subscribers" && session?.user?.id) {
      setFeedLoading(true);
      supabase.from("subscriptions").select("subscriber_id").eq("channel_id", session.user.id).then(({ data }) => {
        if (data && data.length > 0) {
          const ids = data.map(d => d.subscriber_id);
          supabase.from("profiles").select("id, display_name, username, avatar_url, role").in("id", ids).then(({ data: profiles }) => {
            setMySubscribers(profiles || []);
            setFeedLoading(false);
          });
        } else {
          setMySubscribers([]);
          setFeedLoading(false);
        }
        });
        const audioCount = items.filter(i => i.media_type === "audio").length;
        const videoCount = items.filter(i => i.media_type === "video").length;
        if (items.length > 0) {
          let parts = [];
          if (audioCount > 0) parts.push(`${audioCount} audio`);
          if (videoCount > 0) parts.push(`${videoCount} video${videoCount > 1 ? "s" : ""}`);
          setSearchSummary(`Found ${parts.join(" and ")} for "${search}"`);
        } else {
          setSearchSummary(`No results found for "${search}"`);
        }
      } else {
        setSearchSummary("");
      }
  }, [showSubscriptionsFeed, subsTab, session?.user?.id]);

  // Reload feed when Subscriptions is toggled
  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSubscriptionsFeed, category, feedLimit, feedLimit]);

  const [notifications, setNotifications] = useState([]);
  const [selectedNotifs, setSelectedNotifs] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showClearNotifModal, setShowClearNotifModal] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const isSubmittingRef = useRef(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isShortUpload, setIsShortUpload] = useState(false);

  const viewCountedRef = useRef(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadBlockedWords, setUploadBlockedWords] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Music");
  const [uploadArtistName, setUploadArtistName] = useState("");
  const [uploadProducerName, setUploadProducerName] = useState("");
  const [uploadThumbnailFile, setUploadThumbnailFile] = useState(null);
  const [uploadScheduleMode, setUploadScheduleMode] = useState("now");
  const [uploadScheduledAt, setUploadScheduledAt] = useState("");
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBecomeArtistForm, setShowBecomeArtistForm] = useState(false);
  const [baName, setBaName] = useState("");
  const [baBio, setBaBio] = useState("");
  const [baCategory, setBaCategory] = useState("Music");
  const [baPhoto, setBaPhoto] = useState(null);
  const [baCover, setBaCover] = useState(null);
  const [baBusy, setBaBusy] = useState(false);
  const [showAccountPage, setShowAccountPage] = useState(false);

  const [showChannelPage, setShowChannelPage] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [channelSubscribers, setChannelSubscribers] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);

  // Auto-close Description Modal after 10 seconds
  useEffect(() => {
    let timer;
    if (showDescModal) {
      timer = setTimeout(() => {
        setShowDescModal(false);
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timer);
  }, [showDescModal]);

  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [likedComments, setLikedComments] = useState([]);
  const [expandedReplies, setExpandedReplies] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentImage, setCommentImage] = useState(null);
  const [commentAudio, setCommentAudio] = useState(null);
  const [commentAudioUrl, setCommentAudioUrl] = useState(null);
  const [voicePreviewPlaying, setVoicePreviewPlaying] = useState(false);
  const [playingCommentId, setPlayingCommentId] = useState(null);
  const [playingCommentProgress, setPlayingCommentProgress] = useState(0);
  const [playingCommentDuration, setPlayingCommentDuration] = useState(0);
  const [playingCommentSpeed, setPlayingCommentSpeed] = useState(1);
  const playingCommentRef = useRef(null);

  const [voicePreviewDuration, setVoicePreviewDuration] = useState(0);
  const [voicePreviewProgress, setVoicePreviewProgress] = useState(0);
  const [voicePreviewSpeed, setVoicePreviewSpeed] = useState(1);
  const voicePreviewRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [replyTarget, setReplyTarget] = useState(null);
  const [replyingName, setReplyingName] = useState("");
  const [replyingToName, setReplyingToName] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [channelProfile, setChannelProfile] = useState(null);
  const [channelMedia, setChannelMedia] = useState([]);
  const [channelPlaylists, setChannelPlaylists] = useState([]);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState("public");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Fetch Playlists for Channel
  useEffect(() => {
    async function fetchChannelPlaylists() {
      if (!channelProfile?.id) return;
      const { data, error } = await supabase
        .from("playlists")
        .select("*, playlist_items(media_id, media:media_id(id, thumbnail_path, title))")
        .eq("user_id", channelProfile.id)
        .eq("visibility", "public");
      
      if (!error && data) {
        setChannelPlaylists(data);
      }
    }
    fetchChannelPlaylists();
  }, [channelProfile?.id]);

  const [channelLoading, setChannelLoading] = useState(false);
  const [channelTab, setChannelTab] = useState("Videos");


  const [watchArtist, setWatchArtist] = useState(null);

  const [likedIds, setLikedIds] = useState(() => {
    try {
      const raw = localStorage.getItem("ma_likes");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

useEffect(() => {
    if (!activeMedia?.artist_id) {
      setWatchArtist(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,bio")
          .eq("id", activeMedia.artist_id)
          .maybeSingle();
        if (alive) setWatchArtist(data || null);
      } catch {
        if (alive) setWatchArtist(null);
      }
    })();
    return () => { alive = false; };
  }, [activeMedia?.artist_id]);

useEffect(() => {
    if (activeMedia?.id) {
      viewCountedRef.current = false;
      fetchWatchDetails(activeMedia.id);
    }
  }, [activeMedia?.id, session?.user?.id]);




  function closeAllOverlays() {
    setShowAnalytics(false);
    setShowManagePage(false);
    setShowUpload(false);
    setShowHistoryPage(false);
    setShowLikedPage(false);
    setShowAllPlaylists(false);
    setSelectedPlaylist(null);
    setShowChannelPage(false);
    setShowAccountPage(false);
    setShowBecomeArtistForm(false);
    setShowProfileEditor(false);
    setShowPlaylistModal(false);
    setShowShareModal(false);
    setShowCommentsModal(false);
    setShowSubscriptionsFeed(false);
    setShowSubscriptionsPage(false);
    setSubsTab("feed");
    
    // CRITICAL FIX: Only hide the watch page, DO NOT delete the video from memory!
    // This allows the Mini Player to keep playing in the background.
    setShowWatchPage(false);
  }

  function openPlayer(item) {
    if (!item) return;
    
    // Auto-generate URLs if they are missing (fixes Manage Page Play button)
    let playbackUrl = item.playbackUrl;
    if (!playbackUrl && item.storage_path) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
      playbackUrl = data?.publicUrl || "";
    }
    let thumbnailUrl = item.thumbnailUrl;
    if (!thumbnailUrl && item.thumbnail_path) {
      const { data } = supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path);
      thumbnailUrl = data?.publicUrl || "";
    }

    setShowAnalytics(false);
    setShowAccountPage(false);
    setShowChannelPage(false);
    setShowPlaylistDetailPage(false);
    setShowAllPlaylists(false);
    setShowAddVideoToPlaylistModal(false);
    setShowPlaylistDetailMenu(false);
    setActivePlaylistItemMenu(null);
    setActiveMedia({ ...item, playbackUrl, thumbnailUrl });
    setShowWatchPage(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleLike(id) {
    setLikedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem("ma_likes", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("ma_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!activeMedia) return;
    const entry = {
      id: activeMedia.id,
      title: activeMedia.title,
      media_type: activeMedia.media_type,
      thumbnailUrl: activeMedia.thumbnailUrl,
      created_at: activeMedia.created_at,
    };
    setHistory((prev) => {
      const filtered = prev.filter((x) => x.id !== entry.id);
      const next = [entry, ...filtered].slice(0, 20);
      try {
        localStorage.setItem("ma_history", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [activeMedia]);

  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [artistLoading, setArtistLoading] = useState(false);
  const [showArtistStudio, setShowArtistStudio] = useState(false);


  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setMessage(error.message);
      setSession(data?.session ?? null);
          setTimeout(() => {
            setTimeout(() => { if (alive) setLoading(false); }, 3000);
          }, 500);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      
      setSession(newSession);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    let alive = true;

    async function fetchProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

      setArtistLoading(true);

      try {
        const user = session.user;
        const name =
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          " User";

        let { data, error } = await supabase
          .from("profiles")
          .select("id,display_name,role,created_at,username,bio,avatar_url,cover_url,updated_at")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const result = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              display_name: name,
              role: user.user_metadata?.account_type === "creator" ? "artist" : (user.user_metadata?.account_type || "listener"),
            })
            .select("id,display_name,role,created_at,username,bio,avatar_url,cover_url,updated_at")
            .single();

          if (result.error) throw result.error;
          data = result.data;
        }

        if (alive) {
          setProfile(data);
          // Fetch subscriber count for the You Tab
          const { count } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", user.id);
          setSubscriberCount(count || 0);
          setMySubCount(count || 0);
          setMySubCount(count || 0);
        }
      } catch (error) {
        if (alive) {
          setMessage(
            "Could not load your profile: " +
              (error.message || "Unknown error")
          );
        }
      } finally {
        if (alive) setArtistLoading(false);
      }
    }

    fetchProfile();

    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  async function fetchNotifications() {
    if (!session?.user?.id) return;
    const { data } = await supabase.from("notifications")
      .select("*, actor:actor_id(display_name, avatar_url)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.is_read).length);
  }

  async function createNotification(targetUserId, type, mediaId = null) {
    // 🛑 SECURITY LOCK: Passwords are strictly forbidden from being logged
    if (type === "password_change" || type === "password_reset" || type.includes("password")) {
      console.log("Silent action: Password change notification blocked.");
      return;
    }
    
    if (!session?.user?.id || session.user.id === targetUserId) return;
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      actor_id: session.user.id,
      type: type,
      media_id: mediaId
    });
  }

  
  
      
  
  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return setMessage("Passwords do not match.");
    if (newPassword.length < 6) return setMessage("Password must be at least 6 characters.");
    
    setBusy(true);
    setMessage("Updating...");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage("Success! Redirecting...");
      await supabase.auth.signOut();
      localStorage.removeItem('ma_is_resetting_password');
      setShowResetPasswordScreen(false);
      setTimeout(() => window.location.href = "/", 1500);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setBusy(false);
    }
  }



  
  
  async function handleCreatorReset(e) {
    e.preventDefault();
    if (!creatorResetEmail) return;
    setMessage("Sending Creator reset link...");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(creatorResetEmail, {
        redirectTo: window.location.origin + '/recovery.html',
      });
      if (error) throw error;
      setMessage("Creator link sent! Check your email.");
      setShowCreatorResetModal(false);
      setCreatorResetEmail("");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  }

  async function handleForgotPassword() {
    setShowResetModal(true);
  }


  async function submitPasswordReset() {
    if (!resetEmail) return setMessage("Please enter an email address.");
    setMessage("Sending reset link...");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/recovery.html',
      });
      if (error) throw error;
      setMessage("Password reset link sent! Check your email inbox.");
      setShowResetModal(false);
      setResetEmail("");
    } catch (error) {
      setMessage("Error: " + (error.message || "Could not send reset link."));
    }
  }


  const handleShare = async (mediaItem) => {
    if (!mediaItem) { window.alert("No media loaded."); return; }
    const url = window.location.origin + "?track=" + mediaItem.id;
    const shareData = {
      title: mediaItem.title,
      text: "Check out " + mediaItem.title + " on !",
      url: url
    };

    // Try to attach the image file so Android shows the thumbnail
    if (mediaItem.thumbnailUrl && navigator.canShare) {
      try {
        const response = await fetch(mediaItem.thumbnailUrl);
        const blob = await response.blob();
        const file = new File([blob], 'cover.jpg', { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      } catch (e) {
        console.log("Could not fetch image for sharing", e);
      }
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          window.prompt("Copy this link to share:", url);
        }
      }
    } else {
      window.prompt("Copy this link to share:", url);
    }
  };
  const handleShareProfile = async () => {
    const profileUrl = window.location.origin + "?profile=" + (profile?.username || session?.user?.id || "");
    const shareData = {
      title: profile?.display_name || displayUser || "Music Antenna User",
      text: "Check out " + (profile?.display_name || displayUser) + " on Music Antenna!",
      url: profileUrl
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { if (err.name !== "AbortError") window.prompt("Copy this link to share:", profileUrl); }
    } else { window.prompt("Copy this link to share:", profileUrl); }
  };

  
  
  function handleVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSearchStatusMsg("Voice search is not supported in this browser.");
      setTimeout(() => setSearchStatusMsg(""), 3000);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setSearchStatusMsg("🎤 Listening... Speak now.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setSearchStatusMsg(`Heard: "${transcript}"`);
      setTimeout(() => setSearchStatusMsg(""), 2000);
    };

    recognition.onerror = (event) => {
      setSearchStatusMsg("Voice search error: " + event.error);
      setTimeout(() => setSearchStatusMsg(""), 3000);
    };

    recognition.start();
  }


  async function loadMedia() {
    
    setFeedLoading(true);
    if (search.trim()) setSearchLoading(true);
    setMessage("");

    try {
      // 1. Fetch ALL published media (No limits, no joins)
      let query = supabase
        .from("media")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
        
      // ONLY limit the feed if the user is NOT searching
      if (!search.trim()) {
        query = query.limit(feedLimit);
      }

      if (showSubscriptionsFeed && session?.user?.id) {
        const { data: subs } = await supabase.from("subscriptions").select("channel_id").eq("subscriber_id", session.user.id);
        const channelIds = subs?.map(s => s.channel_id) || [];
        if (channelIds.length > 0) {
          query = query.in("artist_id", channelIds);
        } else {
          setMedia([]);
          setFeedLoading(false);
          setSearchLoading(false);
          
          return;
        }
      }

      if (category === "Shorts") query = query.eq("is_short", true);
      else if (category === "Videos") query = query.eq("media_type", "video").eq("is_short", false);
      else if (category === "Music") query = query.eq("media_type", "audio");

      const { data: mediaData, error: mediaError } = await query;
      if (mediaError) throw mediaError;

      // 2. Fetch ALL profiles (No limits, no joins)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url");
      
      if (profilesError) throw profilesError;

      // 3. Create a lookup map for profiles
      const profileMap = {};
      profilesData?.forEach(p => { profileMap[p.id] = p; });

      // 4. Attach profiles and URLs to media
      let items = await Promise.all(
        (mediaData || []).map(async (item) => {
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
          let thumbnailUrl = "";
          if (item.thumbnail_path) {
            const { data: thumb } = supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path);
            thumbnailUrl = thumb?.publicUrl || "";
          }
          return { 
             ...item, 
             playbackUrl: pub?.publicUrl || "", 
             thumbnailUrl,
             profiles: profileMap[item.artist_id] || null
          };
        })
      );

      // 5. LOCAL SEARCH & SORT
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        
        items = items.filter(item => {
          const title = (item.title || "").toLowerCase();
          const desc = (item.description || "").toLowerCase();
          const thumb = (item.thumbnail_path || "").toLowerCase();
          const artist = (item.profiles?.display_name || "").toLowerCase();
          
          return title.includes(term) || desc.includes(term) || artist.includes(term) || thumb.includes(term);
        });

        items.sort((a, b) => {
          const tA = (a.title || "").toLowerCase();
          const tB = (b.title || "").toLowerCase();
          const arA = (a.profiles?.display_name || "").toLowerCase();
          const arB = (b.profiles?.display_name || "").toLowerCase();
          const thA = (a.thumbnail_path || "").toLowerCase();
          const thB = (b.thumbnail_path || "").toLowerCase();
          const dA = (a.description || "").toLowerCase();
          const dB = (b.description || "").toLowerCase();

          const aT = tA.includes(term) ? 4 : 0;
          const bT = tB.includes(term) ? 4 : 0;
          const aA = arA.includes(term) ? 3 : 0;
          const bA = arB.includes(term) ? 3 : 0;
          const aTh = thA.includes(term) ? 2 : 0;
          const bTh = thB.includes(term) ? 2 : 0;
          const aD = dA.includes(term) ? 1 : 0;
          const bD = dB.includes(term) ? 1 : 0;

          if (aT !== bT) return bT - aT;
          if (aA !== bA) return bA - aA;
          if (aTh !== bTh) return bTh - aTh;
          if (aD !== bD) return bD - aD;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      }

      setMedia(items);
    } catch (error) {
      setMessage("Error loading media: " + error.message);
    } finally {
      setFeedLoading(false);
      setSearchLoading(false);
    }
  }

  // Helper function to manually join profiles and generate URLs
  async function attachProfilesAndUrls(mediaData) {
    if (!mediaData || mediaData.length === 0) return [];

    const uniqueArtistIds = [...new Set(mediaData.map(i => i.artist_id).filter(Boolean))];
    let profileMap = {};

    if (uniqueArtistIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", uniqueArtistIds);

      if (profileError) throw profileError;
      profilesData?.forEach(p => { profileMap[p.id] = p; });
    }

    return Promise.all(
      mediaData.map(async (item) => {
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
        let thumbnailUrl = "";
        if (item.thumbnail_path) {
          const { data: thumb } = supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path);
          thumbnailUrl = thumb?.publicUrl || "";
        }
        return {
           ...item,
           playbackUrl: pub?.publicUrl || "",
           thumbnailUrl,
           profiles: profileMap[item.artist_id] || (item.artist_id === session?.user?.id ? profile : null)
        };
      })
    );
  }

  function openBecomeArtistForm() {
    setBaName(profile?.display_name || displayUser || "");
    setBaBio(profile?.bio || "");
    setBaCategory("Music");
    setBaPhoto(null);
    setBaCover(null);
    setShowBecomeArtistForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitBecomeArtist(event) {
    event.preventDefault();
    if (!session?.user?.id) {
      setMessage("Please sign in first.");
      return;
    }
    const name = baName.trim();
    if (!name) {
      setMessage("Enter your artist name.");
      return;
    }

    setBaBusy(true);
    setMessage("");

    try {
      let avatarUrl = profile?.avatar_url || null;
      let coverUrl = profile?.cover_url || null;

      if (baPhoto) {
        avatarUrl = await uploadProfileImage(baPhoto, "avatar");
      }
      if (baCover) {
        coverUrl = await uploadProfileImage(baCover, "cover");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: name,
          bio: baBio.trim() || null,
          role: "artist",
          avatar_url: avatarUrl,
          cover_url: coverUrl,
        })
        .eq("id", session.user.id)
        .select("id,display_name,role,created_at,username,bio,avatar_url,cover_url,updated_at")
        .single();

      if (error) throw error;

      setProfile(data);
      setShowBecomeArtistForm(false);
      setShowAccountPage(true);
      setMessage("Welcome, " + name + "! Your artist profile is now active.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage("Could not activate artist profile: " + (error.message || "Unknown error"));
    } finally {
      setBaBusy(false);
    }
  }

  async function handleBecomeArtist() {
    if (!session?.user?.id) {
      setMessage("Please sign in first.");
      return;
    }

    setArtistLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("become_artist");

      if (error) throw error;

      setProfile(data);
      setShowArtistStudio(true);
      setMessage("Welcome! Your artist profile is now active.");
    } catch (error) {
      setMessage(
        "Could not activate artist profile: " +
        (error.message || "Unknown error")
      );
    } finally {
      setArtistLoading(false);
    }
  }

    async function doAuth(modeVal, accountTypeVal) {
    setBusy(true);
    setMessage("");

    try {
      if (modeVal === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              account_type: accountTypeVal,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          setMessage("Account created successfully!");
        } else {
          setMessage("Check your email to confirm your account.");
          setMode("login");
        }
      } else {
        // LOGIN WITH STRICT ROLE CHECK
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // Check the profile role
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        
        if (prof?.role !== accountTypeVal) {
          await supabase.auth.signOut();
          throw new Error(`This is a ${prof?.role || 'Listener'} account. Please go back and use the correct sign-in page.`);
        }

        setMessage("Welcome back to Music Antenna!");
      }
    } catch (error) {
      const raw = (error.message || "Authentication failed.").toLowerCase();
      if (modeVal === "register" && raw.includes("already registered")) {
        setMode("login");
        setMessage("This email is already registered. Enter your password and tap Sign in.");
      } else {
        setMessage(error.message || "Authentication failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleAuth(event) {
    event.preventDefault();
    doAuth(mode, accountType);
  }

  function clearAuthFields() {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setShowPassword(false);
    setMessage("");
  }

  function handleListenerLogin(event) {
    event.preventDefault();
    setAccountType("listener");
    setMode("login");
    doAuth("login", "listener");
  }

  function handleCreatorLogin(event) {
    event.preventDefault();
    setAccountType("artist");
    setMode("login");
    doAuth("login", "artist");
  }

  function startListenerSignup() {
    setAccountType("listener");
    setAuthTab("listener");
    setMode("register");
    setJustTriedRegister(false);
    setMessage("");
  }

  function startCreatorSignup() {
    setAccountType("artist");
    setAuthTab("creator");
    setMode("register");
    setJustTriedRegister(false);
    setMessage("");
  }

  async function fetchWatchDetails(mediaId) {
    if (!mediaId) return;
    
    // FETCH SUBSCRIBER COUNT FOR WATCH PAGE
    if (activeMedia?.artist_id) {
      const { count: watchSubs } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", activeMedia.artist_id);
      setSubscriberCount(watchSubs || 0);
    }

    // Fetch Likes
    try {
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("media_id", mediaId);
      setLikesCount(count || 0);
      if (session?.user?.id) {
        const { data } = await supabase.from("likes").select("id").eq("media_id", mediaId).eq("user_id", session.user.id).maybeSingle();
        setIsLiked(!!data);
      } else {
        setIsLiked(false);
      }
    } catch (e) { console.error(e); }

    // Fetch Comments
    setCommentsLoading(true);
    try {
      const { data } = await supabase.from("comments")
        .select("*, profiles(display_name, avatar_url)")
        .eq("media_id", mediaId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      setComments(data || []);

      // Load persistent comment likes once for this media.
      const commentIds = (data || []).map(comment => comment.id);
      let likeRows = [];

      if (commentIds.length > 0) {
        const { data: rows, error: likesError } = await supabase
          .from("comment_likes")
          .select("comment_id, user_id")
          .in("comment_id", commentIds);

        if (likesError) throw likesError;
        likeRows = rows || [];
      }

      const likeCounts = {};
      for (const row of likeRows) {
        likeCounts[row.comment_id] = (likeCounts[row.comment_id] || 0) + 1;
      }

      setComments((data || []).map(comment => ({
        ...comment,
        likes: likeCounts[comment.id] || 0
      })));

      setLikedComments(
        session?.user?.id
          ? likeRows
              .filter(row => row.user_id === session.user.id)
              .map(row => row.comment_id)
          : []
      );
    } catch (e) { console.error(e); }
    setCommentsLoading(false);
  }

  async function handleToggleLike(mediaId) {
    if (!session?.user?.id) return setMessage("Sign in to like videos.");
    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("media_id", mediaId).eq("user_id", session.user.id);
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await supabase.from("likes").insert({ media_id: mediaId, user_id: session.user.id });
        if (activeMedia) createNotification(activeMedia.artist_id, "like", mediaId);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (e) { setMessage(e.message); }
  }


  async function handleDeleteVideo() {
    if (!window.confirm("Are you sure you want to delete this video permanently?")) return;
    try {
      await supabase.from("media").delete().eq("id", activeMedia.id);
      await supabase.storage.from(BUCKET).remove([activeMedia.storage_path]);
      if (activeMedia.thumbnail_path) {
        await supabase.storage.from("track-covers").remove([activeMedia.thumbnail_path]);
      }
      setActiveMedia(null);
      loadMedia();
      setMessage("Video deleted successfully.");
    } catch (err) {
      setMessage("Error deleting: " + err.message);
    }
  }

  function openEditPlaylistModal() {
  if (!selectedPlaylist || selectedPlaylist.user_id !== session?.user?.id) {
    setMessage("Only the playlist owner can edit this playlist.");
    return;
  }
  setEditPlaylistTitle(selectedPlaylist.title || "");
  setEditPlaylistDescription(selectedPlaylist.description || "");
  setEditPlaylistVisibility(selectedPlaylist.visibility || "public");
  setShowEditPlaylistModal(true);
}

async function saveEditedPlaylist(e) {
  e.preventDefault();
  if (!selectedPlaylist || selectedPlaylist.user_id !== session?.user?.id) {
    setMessage("Only the playlist owner can edit this playlist.");
    return;
  }

  const title = editPlaylistTitle.trim();
  if (!title) {
    setMessage("Enter a playlist title.");
    return;
  }

  setIsSavingPlaylistEdit(true);
  try {
    const { data, error } = await supabase
      .from("playlists")
      .update({
        title,
        description: editPlaylistDescription.trim(),
        visibility: editPlaylistVisibility
      })
      .eq("id", selectedPlaylist.id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    setSelectedPlaylist(data);
    setPlaylists((old) => old.map((pl) => pl.id === data.id ? { ...pl, ...data } : pl));
    setChannelPlaylists((old) => old.map((pl) => pl.id === data.id ? { ...pl, ...data } : pl));
    setShowEditPlaylistModal(false);
    setMessage("Playlist updated successfully.");
  } catch (err) {
    setMessage("Could not update playlist: " + (err?.message || "Unknown error"));
  } finally {
    setIsSavingPlaylistEdit(false);
  }
}

async function fetchPlaylists() {
    if (!session?.user?.id) {
      setPlaylists([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      setMessage("Could not load playlists: " + err.message);
    }
  }

  async function openPlaylist(pl) {
    setSelectedPlaylist(pl);
    setShowPlaylistDetailPage(true);
    setPlaylistLoading(true);
    setShowAllPlaylists(false);
    try {
      const { data, error } = await supabase.from("playlist_items")
        .select("id, media_id, media:media_id(*, profiles(display_name, avatar_url))")
        .eq("playlist_id", pl.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const itemsWithUrls = await Promise.all((data || []).map(async (item) => {
        const m = item.media;
        const { data: pub } = await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path, 31536000);
        let thumbnailUrl = "";
        if (m.thumbnail_path) {
          const { data: thumb } = await supabase.storage.from("track-covers").createSignedUrl(m.thumbnail_path, 31536000);
          thumbnailUrl = thumb?.signedUrl || "";
        }
        return { ...m, playlistItemId: item.id, media_id: item.media_id, playbackUrl: pub?.signedUrl || "", thumbnailUrl };
      }));
      setPlaylistItems(itemsWithUrls);
    } catch (err) {
      setMessage("Error loading playlist: " + err.message);
    } finally {
      setPlaylistLoading(false);
    }
  }


  async function openAddVideoToPlaylistPicker() {
    if (!session?.user?.id || !selectedPlaylist?.id) { setMessage(!session?.user?.id ? "Please sign in first." : "Open a playlist first."); return; }
    setMediaPickerLoading(true); setShowAddVideoToPlaylistModal(true);
    try { const {data,error}=await supabase.from("media").select("*").eq("status","published").order("created_at",{ascending:false}).limit(100); if(error) throw error; setMediaPickerItems(data||[]); }
    catch(err) { setMediaPickerItems([]); setMessage("Could not load published media: "+(err?.message||"Unknown error")); }
    finally { setMediaPickerLoading(false); }
  }

  async function addMediaToSelectedPlaylist(m) {
    const pl = selectedPlaylist;

    if (!session?.user?.id || !pl?.id || !m?.id) {
      const reason = !session?.user?.id
        ? "Please sign in first."
        : !pl?.id
          ? "Open a playlist first."
          : "This video has no valid media ID.";
      setPlaylistActionMessage(reason);
      setMessage(reason);
      return;
    }

    if (addingMediaId) return;

    setAddingMediaId(m.id);
    setPlaylistActionMessage("Adding video…");

    try {
      const { data: found, error: checkError } = await supabase
        .from("playlist_items")
        .select("id")
        .eq("playlist_id", pl.id)
        .eq("media_id", m.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (found) {
        const reason = "This video is already in the playlist.";
        setPlaylistActionMessage(reason);
        setMessage(reason);
        return;
      }

      const { data: positions, error: posError } = await supabase
        .from("playlist_items")
        .select("position")
        .eq("playlist_id", pl.id)
        .order("position", { ascending: false })
        .limit(1);

      if (posError) throw posError;

      const position = positions?.length
        ? (Number(positions[0].position) || 0) + 1
        : 0;

      const { error: insertError } = await supabase
        .from("playlist_items")
        .insert({ playlist_id: pl.id, media_id: m.id, position });

      if (insertError) throw insertError;

      setPlaylistActionMessage("Video added to playlist successfully.");
      setMessage("Video added to playlist successfully.");
      await openPlaylist(pl);
    } catch (err) {
      const reason = "Could not add video: " + (err?.message || "Unknown error");
      setPlaylistActionMessage(reason);
      setMessage(reason);
    } finally {
      setAddingMediaId(null);
    }
  }

  async function deletePlaylist(id) {
    if (!window.confirm("Delete this playlist permanently?")) return;
    try {
      await supabase.from("playlists").delete().eq("id", id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      setSelectedPlaylist(null);
      setMessage("Playlist deleted.");
    } catch (err) { setMessage("Error: " + err.message); }
    finally { 
      // KEEP BUTTON LOCKED FOR 3 SECONDS
      setTimeout(() => {
        setIsPostingComment(false);
        isSubmittingRef.current = false;
      }, 3000);
    }
  }

  async function removeFromPlaylist(itemId) {
    try {
      await supabase.from("playlist_items").delete().eq("id", itemId);
      setPlaylistItems(prev => prev.filter(i => i.id !== itemId));
      setMessage("Removed from playlist.");
    } catch (err) { setMessage("Error: " + err.message); }
    finally { 
      // KEEP BUTTON LOCKED FOR 3 SECONDS
      setTimeout(() => {
        setIsPostingComment(false);
        isSubmittingRef.current = false;
      }, 3000);
    }
  }

  async function handleCreatePlaylist(e) {
    e.preventDefault();
    if (!newPlaylistName.trim() || !session?.user?.id) return;
    try {
      const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim() }).select().single();
      if (error) throw error;
      setPlaylists([data, ...playlists]);
      setNewPlaylistName("");
      setMessage("Playlist created! Now select it to add the video.");
    } catch (err) { setMessage("Error: " + err.message); }
    finally { 
      // KEEP BUTTON LOCKED FOR 3 SECONDS
      setTimeout(() => {
        setIsPostingComment(false);
        isSubmittingRef.current = false;
      }, 3000);
    }
  }

  async function addToPlaylist(playlistId) {
    try {
      const { error } = await supabase.from("playlist_items").insert({ playlist_id: playlistId, media_id: activeMedia.id });
      if (error && error.code !== "23505") throw error; 
      setMessage(error ? "Video is already in this playlist." : "Added to playlist!");
      setShowPlaylistModal(false);
    } catch (err) { setMessage("Error: " + err.message); }
    finally { 
      // KEEP BUTTON LOCKED FOR 3 SECONDS
      setTimeout(() => {
        setIsPostingComment(false);
        isSubmittingRef.current = false;
      }, 3000);
    }
  }

  async function openLikedPage() {
    if (!session?.user?.id) return;
    setShowLikedPage(true);
    setShowAccountPage(false);
    setLikedLoading(true);
    try {
      const { data: likes } = await supabase.from("likes").select("media_id").eq("user_id", session.user.id);
      if (likes && likes.length > 0) {
        const ids = likes.map(l => l.media_id);
        const { data: vids } = await supabase.from("media").select("*, profiles(display_name, avatar_url)").in("id", ids);
        // Add signed URLs
        const withUrls = await Promise.all((vids || []).map(async (item) => {
          const { data: pub } = await supabase.storage.from(BUCKET).createSignedUrl(item.storage_path, 31536000);
          let thumbnailUrl = "";
          if (item.thumbnail_path) {
            const { data: thumb } = await supabase.storage.from("track-covers").createSignedUrl(item.thumbnail_path, 31536000);
            thumbnailUrl = thumb?.signedUrl || "";
          }
          return { ...item, playbackUrl: pub?.signedUrl || "", thumbnailUrl };
        }));
        setLikedMedia(withUrls);
      } else {
        setLikedMedia([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLikedLoading(false);
    }
  }

  async function openManagePage(source = "account") {
    if (!session?.user?.id) {
      setMessage("Please sign in to manage content.");
      return;
    }
    
    setManageSource(source);
    setShowManagePage(true);
    setShowAccountPage(false);
    setShowChannelPage(false);
    setActiveMedia(null);
    setManageLoading(true);

    // 1. INSTANT LOAD from local memory
    const localMedia = media.filter(m => m.artist_id === session.user.id);
    if (localMedia.length > 0) {
      setManageMedia(localMedia);
      setManageLoading(false);
    } else {
      setManageMedia([]);
    }

    // 2. BACKGROUND FETCH and generate missing URLs
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("artist_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map over data to add playbackUrl and thumbnailUrl for the player
        const processedData = await Promise.all(data.map(async (item) => {
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
          let thumbnailUrl = "";
          if (item.thumbnail_path) {
            const { data: thumb } = supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path);
            thumbnailUrl = thumb?.publicUrl || "";
          }
          return {
            ...item,
            playbackUrl: pub?.publicUrl || "",
            thumbnailUrl
          };
        }));
        setManageMedia(processedData);
      }
    } catch (err) {
      console.error("Manage page fetch error:", err);
      if (localMedia.length === 0) setMessage("Failed to load: " + err.message);
    } finally {
      setManageLoading(false);
    }
  }

  function startEditingVideo(item) {
    setEditingMedia(item);
    setEditTitle(item.title);
    setEditDesc(item.description || "");
    setEditVisibility(item.visibility || "public");
    setEditAllowDownload(item.allow_download || false);
    setEditThumbnailFile(null);
  }

  async function handleUpdateVideo(e) {
    e.preventDefault();
    if (!editingMedia) return;
    setEditSaving(true);
    try {
      let newThumbPath = editingMedia.thumbnail_path;
      
      if (editThumbnailFile) {
        const safe = editThumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = session.user.id + "/" + Date.now() + "-thumb-" + safe;
        const { error: upErr } = await supabase.storage.from("track-covers").upload(path, editThumbnailFile);
        if (!upErr) newThumbPath = path;
      }

      const { error } = await supabase.from("media").update({
        title: editTitle,
        description: editDesc,
        visibility: editVisibility,
        allow_download: editAllowDownload,
        thumbnail_path: newThumbPath
      }).eq("id", editingMedia.id);

      if (error) throw error;
      
      setMessage("Video updated successfully!");
      setEditingMedia(null);
      openManagePage("channel"); // Refresh list
      loadMedia(); // Refresh home feed
    } catch (err) {
      setMessage("Error updating: " + err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteVideo(id, storagePath, thumbPath) {
    if (!window.confirm("Delete this video permanently?")) return;
    try {
      await supabase.from("media").delete().eq("id", id);
      await supabase.storage.from(BUCKET).remove([storagePath]);
      if (thumbPath) await supabase.storage.from("track-covers").remove([thumbPath]);
      
      setMessage("Video deleted.");
      if (editingMedia?.id === id) setEditingMedia(null);
      openManagePage("channel");
      loadMedia();
    } catch (err) {
      setMessage("Error deleting: " + err.message);
    }
  }

  

  async function handlePinComment(commentId, currentPinned) {
    try {
      await supabase.from("comments").update({ is_pinned: !currentPinned }).eq("id", commentId);
      setComments(prev => {
        const updated = prev.map(c => c.id === commentId ? { ...c, is_pinned: !currentPinned } : c);
        return updated.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
      });
    } catch (err) { setMessage(err.message); }
  }

  async function handleCreatorHeart(commentId, currentHeart) {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, has_creator_heart: !currentHeart } : c));
    try {
      await supabase.from("comments").update({ has_creator_heart: !currentHeart }).eq("id", commentId);
    } catch (err) { 
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, has_creator_heart: currentHeart } : c));
      setMessage(err.message); 
    }
  }

  async function handleLikeComment(commentId, currentLikes, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!session?.user?.id) {
      setMessage("Sign in to like comments.");
      return;
    }

    const userId = session.user.id;
    const isLiked = likedComments.includes(commentId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: userId });
        if (error && error.code !== "23505") throw error;
      }

      // Reflect the successful database change immediately.
      setLikedComments(prev =>
        isLiked
          ? prev.filter(id => id !== commentId)
          : prev.includes(commentId) ? prev : [...prev, commentId]
      );

      const { count, error: countError } = await supabase
        .from("comment_likes")
        .select("*", { count: "exact", head: true })
        .eq("comment_id", commentId);

      if (countError) throw countError;

      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? { ...comment, likes: count ?? 0 }
          : comment
      ));
    } catch (err) {
      console.error("Unable to update comment like:", err);
      setMessage(err.message || "Couldn't update comment like. Please try again.");
    }
  }

  async function handleUpdateComment(commentId) {
    if (!editCommentText.trim()) return;
    try {
      await supabase.from("comments").update({ content: editCommentText }).eq("id", commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentText } : c));
      setEditingCommentId(null);
    } catch (err) { setMessage(err.message); }
  }

  
  async function handleReportVideo(mediaId) {
    try {
      const { data } = await supabase.from("media").select("report_count").eq("id", mediaId).single();
      const newCount = (data?.report_count || 0) + 1;
      
      await supabase.from("media").update({ 
        report_count: newCount,
        status: newCount >= 3 ? "under_review" : "published" 
      }).eq("id", mediaId);
      
      setMessage(newCount >= 3 ? "Video reported. It has been hidden for review." : "Video reported. Thank you.");
    } catch (err) {
      setMessage("Could not report video.");
    }
  }

  async function handleDeleteComment(commentId) {
    // 1. Instantly close the modal and remove the comment from the UI
    setDeletingCommentId(null);
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    try {
      // 2. Delete ONLY the specific comment ID from the database
      const { data: commentData } = await supabase.from("comments").select("user_id, media_id").eq("id", commentId).single();
        
        const { error } = await supabase.from("comments").delete().eq("id", commentId);
        if (error) throw error;

        if (commentData && commentData.user_id !== session?.user?.id) {
          const { error: notifError } = await supabase.rpc('notify_comment_deleted', {
            target_user_id: commentData.user_id,
            actor_user_id: session.user.id,
            target_media_id: commentData.media_id,
            creator_name: profile?.display_name || "Creator"
          });
          if (notifError) {
            console.error("RPC ERROR:", notifError);
          } else {
            console.log("Notification inserted successfully!");
          }
        }
      if (error) throw error;
      setMessage("Comment deleted.");
    } catch (err) { 
      setMessage("Error deleting comment: " + err.message); 
      // If it fails, you might want to refetch comments to restore it, 
      // but for now, the UI stays clean.
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return setMessage("Microphone not supported on this browser.");
    }
    
    try {
      // Pause ALL audio and video tags on the page (Main + Mini Player)
      window._wasPlayingBeforeRecord = false;
      document.querySelectorAll('audio, video').forEach(el => {
        if (!el.paused) {
          el.pause();
          window._wasPlayingBeforeRecord = true;
        }
      });

      setMessage("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setCommentAudio(audioBlob);
        setCommentAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setMessage("Recording started...");
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 35) {
            stopRecording();
            setMessage("Recording stopped at 35 seconds max.");
            
            return 35;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.log("Mic Error:", err);
      setMessage("Error: " + err.message);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      
      // Resume the main player if it was playing before
      if (window._wasPlayingBeforeRecord) {
        setTimeout(() => {
          if (activeMedia?.media_type === 'audio' && audioRef.current) audioRef.current.play().catch(()=>{});
          if (activeMedia?.media_type === 'video' && videoRef.current) videoRef.current.play().catch(()=>{});
        }, 300);
        window._wasPlayingBeforeRecord = false;
      }
    }
  }

  async function handlePostComment(e) {
    e.preventDefault();

    // LAYER 1: SYNCHRONOUS LOCK (Blocks double clicks instantly)
    if (isSubmittingRef.current) return;
    
    if (!session?.user?.id) return setMessage("Sign in to comment.");
    if (!newComment.trim() && !commentImage && !commentAudio) return;

    // --- CUSTOM WORD FILTER ---
    const blockedWordsRaw = activeMedia?.blocked_words;
    if (blockedWordsRaw && newComment.trim()) {
      const blockedList = blockedWordsRaw.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
      const commentLower = newComment.toLowerCase();
      for (let word of blockedList) {
        if (commentLower.includes(word)) {
          return setMessage(`This comment contains restricted words: "${word}"`);
        }
      }
    }

    // ENGAGE LOCK
    isSubmittingRef.current = true;
    setIsPostingComment(true);
    setMessage("Posting comment...");

    let imageUrl = null;
    let audioUrl = null;
    
    const submitComment = newComment;
    const submitReplyTarget = replyTarget;
    const submitImage = commentImage;
    const submitAudio = commentAudio;

    try {
      if (submitReplyTarget) {
        const { data: parentExists } = await supabase.from("comments").select("id").eq("id", submitReplyTarget).single();
        if (!parentExists) {
          setReplyTarget(null);
          setReplyingName("");
          throw new Error("The comment you are replying to has been deleted.");
        }
      }

      if (submitImage) {
        const safeName = submitImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = session.user.id + "/" + Date.now() + "-img-" + safeName;
        const { error: imgErr } = await supabase.storage.from("comment-media").upload(path, submitImage);
        if (imgErr) throw imgErr;
        imageUrl = supabase.storage.from("comment-media").getPublicUrl(path).data.publicUrl;
      }

      if (submitAudio) {
        const path = session.user.id + "/" + Date.now() + "-voice.webm";
        const { error: audErr } = await supabase.storage.from("comment-media").upload(path, submitAudio);
        if (audErr) throw audErr;
        audioUrl = supabase.storage.from("comment-media").getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase.from("comments").insert({
        media_id: activeMedia.id,
        user_id: session.user.id,
        content: submitComment.trim(),
        parent_id: submitReplyTarget ? submitReplyTarget : null,
        image_url: imageUrl,
        audio_url: audioUrl
      }).select("*, profiles(display_name, avatar_url)").single();

      if (error) throw error;

      // LAYER 3: DISPLAY CORRECTION (React deduplication)
      setComments(prev => prev.some(c => c.id === data.id) ? prev : [data, ...prev]);
      
      setNewComment("");
      setCommentImage(null);
      setCommentAudio(null);
      setCommentAudioUrl(null);
      setVoicePreviewPlaying(false);
      setVoicePreviewProgress(0);
      setReplyTarget(null);
      setReplyingName("");
      setMessage("Comment posted!");

    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      // RELEASE LOCK
      setIsPostingComment(false);
      isSubmittingRef.current = false;
    }
  }

    
  async function handleAddToPlaylist(playlistId, playlistTitle) {
    const mediaId = activeMedia?.id;

    console.log("Save to playlist attempt:", {
      playlistId,
      mediaId,
      mediaTitle: activeMedia?.title,
      userId: session?.user?.id
    });

    if (!session?.user?.id) {
      setMessage("Please sign in to save videos to playlists.");
      return;
    }

    if (!mediaId) {
      setMessage("Could not identify this video. Close the menu, reopen it, and try again.");
      console.error("Save failed: activeMedia has no ID", activeMedia);
      return;
    }

    if (!playlistId) {
      setMessage("Playlist ID is missing. Please reopen the playlist menu.");
      return;
    }

    try {
      const { data: items, error: positionError } = await supabase
        .from("playlist_items")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      if (positionError) throw positionError;

      const nextPos = items?.length
        ? (Number(items[0].position) || 0) + 1
        : 0;

      const { error: insertError } = await supabase
        .from("playlist_items")
        .insert({
          playlist_id: playlistId,
          media_id: mediaId,
          position: nextPos
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setMessage("This video is already in that playlist.");
          return;
        }
        throw insertError;
      }

      setShowPlaylistModal(false);
      setAddedPlaylistId(playlistId);
      setAddedPlaylistTitle(playlistTitle || "Playlist");
      setShowAddSuccessModal(true);
      setMessage("Video saved to playlist.");
    } catch (err) {
      console.error("Save to playlist failed:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        playlistId,
        mediaId
      });
      setMessage("Could not save video: " + (err?.message || "Unknown error"));
    }
  }

  async function handleCreateNewPlaylist() {
    if (!newPlaylistName.trim()) return;
    try {
      const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
      if (error) throw error;

      if (activeMedia?.id) {
        await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
      }

      setPlaylists(prev => [data, ...prev]);
      setNewPlaylistName("");
      setShowPlaylistModal(false);

      setAddedPlaylistId(data.id);
      setAddedPlaylistTitle(data.title);
      setShowAddSuccessModal(true);
      setMessage("Playlist created successfully!");
    } catch(err) {
      setMessage("Error creating playlist: " + err.message);
    }
  }

  
  function addToQueue(item, position) {
    if (position === 'next') {
      setVideoQueue(prev => [item, ...prev]);
      setMessage("Added to play next.");
    } else {
      setVideoQueue(prev => [...prev, item]);
      setMessage("Added to play last.");
    }
  }

  function handleSaveToWatchLater(item) {
    try {
      const existing = JSON.parse(localStorage.getItem('watchLater') || '[]');
      if (!existing.find(i => i.id === item.id)) {
        existing.push(item);
        localStorage.setItem('watchLater', JSON.stringify(existing));
        setMessage("Saved to Watch Later!");
      } else {
        setMessage("Already in Watch Later.");
      }
    } catch (e) {
      setMessage("Error saving to Watch Later.");
    }
  }

  function handleVideoEnded() {
    if (videoQueue.length > 0) {
      const nextVideo = videoQueue[0];
      setVideoQueue(prev => prev.slice(1));
      openPlayer(nextVideo);
    }
  }

  
  async function handleUpdatePlaylistCover(e) {
    const file = e.target.files[0];
    if (!file || !selectedPlaylist) return;
    setIsUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `playlist-cover-${selectedPlaylist.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.from('playlists').update({ cover_url: publicUrl }).eq('id', selectedPlaylist.id);
      if (updateError) throw updateError;
      
      setSelectedPlaylist(prev => ({ ...prev, cover_url: publicUrl }));
      // Update the main grid list too
      setChannelPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? { ...p, cover_url: publicUrl } : p));
      setMessage("Playlist cover updated!");
    } catch (err) {
      setMessage("Error uploading cover: " + err.message);
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleDeletePlaylistItem(itemId) {
    try {
      const { error } = await supabase.from('playlist_items').delete().eq('id', itemId);
      if (error) throw error;
      setPlaylistItems(prev => prev.filter(i => i.playlistItemId !== itemId));
      setSelectedPlaylistItems(prev => prev.filter(id => id !== itemId));
      setMessage("Video removed.");
    } catch (err) { setMessage("Error removing video: " + err.message); }
  }

  async function handleDeleteSelectedPlaylistItems() {
    if (selectedPlaylistItems.length === 0) return;
    if (!window.confirm(`Delete ${selectedPlaylistItems.length} videos from this playlist?`)) return;
    
    try {
      const { error } = await supabase.from('playlist_items').delete().in('id', selectedPlaylistItems);
      if (error) throw error;
      
      setPlaylistItems(prev => prev.filter(i => !selectedPlaylistItems.includes(i.playlistItemId)));
      setSelectedPlaylistItems([]);
      setMessage("Selected videos removed.");
    } catch (err) { setMessage("Error removing videos: " + err.message); }
  }

  function toggleSelectPlaylistItem(itemId) {
    setSelectedPlaylistItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  }

  
  async function handleCreateNewPlaylist() {
    if (!newPlaylistName.trim()) return;
    try {
      const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
      if (error) throw error;

      if (activeMedia?.id) {
        await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
      }

      setPlaylists(prev => [data, ...prev]);
      setNewPlaylistName("");
      setShowPlaylistModal(false);

      setAddedPlaylistId(data.id);
      setAddedPlaylistTitle(data.title);
      setShowAddSuccessModal(true);
      setMessage("Playlist created successfully!");
    } catch(err) {
      setMessage("Error creating playlist: " + err.message);
    }
  }

  
  function addToQueue(item, position) {
    if (position === 'next') {
      setVideoQueue(prev => [item, ...prev]);
      setMessage("Added to play next.");
    } else {
      setVideoQueue(prev => [...prev, item]);
      setMessage("Added to play last.");
    }
  }

  function handleSaveToWatchLater(item) {
    try {
      const existing = JSON.parse(localStorage.getItem('watchLater') || '[]');
      if (!existing.find(i => i.id === item.id)) {
        existing.push(item);
        localStorage.setItem('watchLater', JSON.stringify(existing));
        setMessage("Saved to Watch Later!");
      } else {
        setMessage("Already in Watch Later.");
      }
    } catch (e) {
      setMessage("Error saving to Watch Later.");
    }
  }

  function handleVideoEnded() {
    if (videoQueue.length > 0) {
      const nextVideo = videoQueue[0];
      setVideoQueue(prev => prev.slice(1));
      openPlayer(nextVideo);
    }
  }

  
  async function handleUpdatePlaylistCover(e) {
    const file = e.target.files[0];
    if (!file || !selectedPlaylist) return;
    setIsUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `playlist-cover-${selectedPlaylist.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.from('playlists').update({ cover_url: publicUrl }).eq('id', selectedPlaylist.id);
      if (updateError) throw updateError;
      
      setSelectedPlaylist(prev => ({ ...prev, cover_url: publicUrl }));
      // Update the main grid list too
      setChannelPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? { ...p, cover_url: publicUrl } : p));
      setMessage("Playlist cover updated!");
    } catch (err) {
      setMessage("Error uploading cover: " + err.message);
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleDeletePlaylistItem(itemId, playlistId) {
    try {
      const { error } = await supabase.from('playlist_items').delete().eq('id', itemId);
      if (error) throw error;
      setPlaylistItems(prev => prev.filter(i => i.playlistItemId !== itemId));
      setMessage("Video removed from playlist.");
    } catch (err) {
      setMessage("Error removing video: " + err.message);
    }
  }

  async function handleDeletePlaylist(playlistId) {
    if (!window.confirm("Delete this playlist permanently?")) return;
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
      if (error) throw error;
      setChannelPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setMessage("Playlist deleted.");
    } catch (err) {
      setMessage("Error deleting playlist: " + err.message);
    }
  }

  async function fetchUserPlaylistsForModal() {
    if (!session?.user?.id) return;
    const { data } = await supabase.from("playlists").select("*").eq("user_id", session.user.id);
    if (data) setPlaylists(data);
  }

  async function checkSubscription(channelId) {
    if (!channelId) return;
    try {
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channelId);
      
      const finalCount = count || 0;
      setSubscriberCount(finalCount);
      
      // If this is my own channel, update the You Tab count too
      if (channelId === session?.user?.id) {
        setMySubCount(finalCount);
      }

      if (session?.user?.id) {
        const { data } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("channel_id", channelId)
          .eq("subscriber_id", session.user.id)
          .maybeSingle();
        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Sub check failed", err);
    }
  }

  async function handleToggleSubscribe(channelId) {
    if (!session?.user?.id) return setMessage("Please sign in to subscribe.");
    
    // OPTIMISTIC UPDATE: Change the UI instantly so it feels fast
    const wasSubscribed = isSubscribed;
    const oldCount = subscriberCount;
    const oldMyCount = mySubCount;

    setIsSubscribed(!wasSubscribed);
    setSubscriberCount(prev => wasSubscribed ? Math.max(0, prev - 1) : prev + 1);
    if (channelId === session.user.id) {
      setMySubCount(prev => wasSubscribed ? Math.max(0, prev - 1) : prev + 1);
    }

    try {
      if (wasSubscribed) {
        // Unsubscribe
        const { error } = await supabase.from("subscriptions").delete().eq("channel_id", channelId).eq("subscriber_id", session.user.id);
        if (error) throw error;
      } else {
        // Subscribe
        const { error } = await supabase.from("subscriptions").insert({ channel_id: channelId, subscriber_id: session.user.id });
        if (error) throw error;
        createNotification(channelId, "subscribe");
      }
    } catch (err) {
      // REVERT UI if database fails
      setIsSubscribed(wasSubscribed);
      setSubscriberCount(oldCount);
      setMySubCount(oldMyCount);
      
      // Handle duplicate errors gracefully
      if (err.message.includes("duplicate key")) {
        setIsSubscribed(true);
        setMessage("You are already subscribed to this channel.");
      } else {
        setMessage("Sub Error: " + err.message);
      }
    }
  }

            async function openAnalytics() {
    if (!session?.user?.id) return;
    setShowAnalytics(true);
    setShowChannelPage(false);
    setShowAccountPage(false);
    setAnalyticsLoading(true);

    try {
      // 1. Use the videos we ALREADY have in memory (same as Dashboard)
      const localMedia = media.filter(m => m.artist_id === session.user.id);
      const totalViews = localMedia.reduce((sum, m) => sum + (m.views || 0), 0);
      const mediaIds = localMedia.map(m => m.id);

      // 2. Use the subscriber count we ALREADY know is correct from the Dashboard
      // We check mySubCount first. If it's 0, we do a fresh query just in case.
      let finalSubs = mySubCount;
      
      if (finalSubs === 0) {
        const { count: freshSubs, error: subsError } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", session.user.id);
          
        if (!subsError && freshSubs !== null) {
          finalSubs = freshSubs;
        }
      }

      // 3. Fetch weekly stats
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let weeklyViews = 0;
      if (mediaIds.length > 0) {
        const { count: wv } = await supabase.from("video_views").select("*", { count: "exact", head: true }).in("media_id", mediaIds).gte("created_at", sevenDaysAgo);
        weeklyViews = wv || 0;
      }

      const { count: weeklySubs } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", session.user.id).gte("created_at", sevenDaysAgo);

      let totalComments = 0;
      if (mediaIds.length > 0) {
        const { count: tc } = await supabase.from("comments").select("*", { count: "exact", head: true }).in("media_id", mediaIds);
        totalComments = tc || 0;
      }

      // 4. Update BOTH the Dashboard state and Analytics state to match perfectly
      setMySubCount(finalSubs);
      setSubscriberCount(finalSubs);
      
      setAnalyticsData({
        totalViews: totalViews,
        totalSubs: finalSubs,
        totalComments: totalComments,
        weeklyViews: weeklyViews,
        weeklySubs: weeklySubs || 0
      });
      
    } catch (err) {
      setMessage("Error loading analytics: " + err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function openChannel(artistId) {
    if (!artistId) return;
    setShowAnalytics(false);
    setChannelLoading(true);
    setShowChannelPage(true);
    setChannelProfile(null);
    setChannelMedia([]);
    setSubscriberCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // CRITICAL FIX: Fetch the subscription status immediately
    checkSubscription(artistId);

    try {
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id,display_name,role,created_at,username,bio,avatar_url,cover_url,updated_at")
        .eq("id", artistId)
        .maybeSingle();

      if (profErr) throw profErr;
      setChannelProfile(prof || { id: artistId, display_name: "Unknown artist" });

      const { count: subs } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", artistId);
      setSubscriberCount(subs || 0);

      const { data: list, error: listErr } = await supabase
        .from("media")
        .select("id,artist_id,title,description,media_type,storage_path,thumbnail_path,status,allow_download,created_at,views")
        .eq("artist_id", artistId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(60);

      if (listErr) throw listErr;

      const items = await Promise.all(
        (list || []).map(async (item) => {
          // USE PUBLIC URL
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
          let thumbnailUrl = "";
          if (item.thumbnail_path) {
            const { data: thumb } = supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path);
            thumbnailUrl = thumb?.publicUrl || "";
          }
          return { ...item, playbackUrl: pub?.publicUrl || "", thumbnailUrl };
        })
      );
      setChannelMedia(items);
    } catch (error) {
      setMessage("Could not load channel: " + error.message);
    } finally {
      setChannelLoading(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "Signed out successfully.");
    setBusy(false);
  }


  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!session?.user?.id) {
      setMessage("Please sign in to edit your profile.");
      return;
    }

    const name = profileName.trim();
    if (!name) {
      setMessage("Enter a username or display name.");
      return;
    }

    for (const file of [profilePhotoFile, coverPhotoFile]) {
      if (file && !file.type.startsWith("image/")) {
        setMessage("Choose image files for your profile picture and cover.");
        return;
      }
      if (file && file.size > 5 * 1024 * 1024) {
        setMessage("Each profile image must be 5 MB or smaller.");
        return;
      }
    }

    setProfileSaving(true);
    setMessage("Saving profile...");

    try {
      let avatarUrl = profile?.avatar_url || null;
      let coverUrl = profile?.cover_url || null;

      async function uploadProfileImage(file, kind) {
        if (!file) return null;

        const extension = file.name.split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
        const path = `${session.user.id}/profile-${kind}-${Date.now()}.${extension || "jpg"}`;

        const { error } = await supabase.storage
          .from("track-covers")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("track-covers")
          .getPublicUrl(path);

        return data.publicUrl;
      }

      if (profilePhotoFile) {
        avatarUrl = await uploadProfileImage(profilePhotoFile, "avatar");
      }

      if (coverPhotoFile) {
        coverUrl = await uploadProfileImage(coverPhotoFile, "cover");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: name,
          username: name,
          bio: profileBio.trim(),
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)
        .select("id,display_name,role,created_at,username,bio,avatar_url,cover_url,updated_at")
        .single();

      if (error) throw error;

      setProfile(data);
      setProfilePhotoFile(null);
      setCoverPhotoFile(null);
      setShowProfileEditor(false);
      setMessage("Profile saved successfully.");
    } catch (error) {
      setMessage("Could not save profile: " + (error.message || "Check your database and image-storage permissions."));
    } finally {
      setProfileSaving(false);
    }
  }


  function extractVideoFrame(file) {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = "anonymous";
        video.src = url;
        const cleanup = () => { try { URL.revokeObjectURL(url); } catch {} };
        const fail = () => { cleanup(); resolve(null); };
        video.onloadedmetadata = () => { try { video.currentTime = Math.min(0.5, (video.duration || 1) / 3); } catch { fail(); } };
        video.onseeked = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => { cleanup(); resolve(blob); }, "image/jpeg", 0.82);
          } catch { fail(); }
        };
        video.onerror = fail;
        setTimeout(fail, 8000);
      } catch { resolve(null); }
    });
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!session) {
      setMessage("Please sign in before uploading.");
      return;
    }



    if (!uploadFile || !uploadTitle.trim()) {
      setMessage("Enter a title and select an audio or video file.");
      return;
    }

    const isVideo = uploadFile.type.startsWith("video/");
    const isAudio = uploadFile.type.startsWith("audio/");

    if (!isVideo && !isAudio) {
      setMessage("Choose a supported audio or video file.");
      return;
    }

    if (uploadFile.size > 50 * 1024 * 1024) {
      setMessage("This upload exceeds the bucket's 50 MB file limit.");
      return;
    }

    setBusy(true);
    setMessage("Uploading your media...");

    try {
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path =
        session.user.id +
        "/" +
        Date.now() +
        "-" +
        safeName;

      // FORCE MIME TYPE FIX
      let fileToUpload = uploadFile;
      if (uploadFile.type === "audio/x-m4a" || uploadFile.type === "audio/m4a") {
        fileToUpload = new File([uploadFile], uploadFile.name, { type: "audio/mp4" });
      }

      // Force Android m4a files to use the standard mp4 MIME type
      let safeMime = uploadFile.type;
      if (safeMime.includes("m4a")) {
        safeMime = "audio/mp4";
      }

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, fileToUpload, {
          contentType: safeMime,
          upsert: false,
        });

      if (storageError) throw storageError;

      // Upload custom thumbnail (if provided)
      let thumbnailPath = null;
      let thumbSource = uploadThumbnailFile;

      // If no custom thumbnail and it's a video, auto-generate from the first frame
      if (!thumbSource && isVideo) {
        setMessage("Generating video thumbnail...");
        const frameBlob = await extractVideoFrame(uploadFile);
        if (frameBlob) {
          thumbSource = new File(
            [frameBlob],
            "auto-frame-" + Date.now() + ".jpg",
            { type: "image/jpeg" }
          );
        }
      }

      if (thumbSource) {
        const thumbSafe = thumbSource.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const thumbPath =
          session.user.id + "/" + Date.now() + "-thumb-" + thumbSafe;
        const { error: thumbErr } = await supabase.storage
          .from("track-covers")
          .upload(thumbPath, thumbSource, {
            contentType: thumbSource.type || "image/jpeg",
            upsert: false,
          });
        if (thumbErr) {
          setMessage("Thumbnail upload failed: " + thumbErr.message);
        } else {
          thumbnailPath = thumbPath;
        }
      }

      const isScheduled = uploadScheduleMode === "schedule" && uploadScheduledAt;
      const finalStatus = isScheduled ? "scheduled" : "published";
      const scheduledIso = isScheduled
        ? new Date(uploadScheduledAt).toISOString()
        : null;

      const { error: insertError } = await supabase.from("media").insert({
        blocked_words: uploadBlockedWords.trim(),
        artist_id: session.user.id,
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        media_type: isVideo ? "video" : "audio",
        storage_path: path,
        thumbnail_path: thumbnailPath,
        status: finalStatus,
        allow_download: allowDownload,
        is_short: isShortUpload,
        category: uploadCategory,
        artist_name: uploadArtistName.trim() || null,
        producer_name: isAudio ? (uploadProducerName.trim() || null) : null,
        scheduled_at: scheduledIso,
        visibility: "public",
      });

      if (insertError) {
        setMessage(
          "The file uploaded, but the media record could not be saved: " +
            insertError.message +
            ". The uploaded file remains in storage."
        );
        return;
      }

      setMessage(
        isScheduled
          ? "Your media was scheduled for " + new Date(scheduledIso).toLocaleString()
          : "Your media was published successfully!"
      );
      setUploadTitle("");
      setUploadDescription("");
      setUploadFile(null);
      setAllowDownload(false);
      setUploadCategory("Music"); setIsShortUpload(false);
      setUploadArtistName("");
      setUploadProducerName("");
      setUploadThumbnailFile(null);
      setUploadScheduleMode("now");
      setUploadScheduledAt("");
      setShowUpload(false);

      const fileInput = document.getElementById("media-file");
      if (fileInput) fileInput.value = "";
      const thumbInput = document.getElementById("media-thumb");
      if (thumbInput) thumbInput.value = "";

      await loadMedia();
    } catch (error) {
      setMessage(
        "Upload failed: " +
          (error.message || "Check your storage and database policies.")
      );
    } finally {
      setBusy(false);
    }
  }

  const visibleMedia = media.filter((item) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      (item.description || "").toLowerCase().includes(query);

    const matchesCategory =
      category === "All" ||
      (category === "Music" && item.media_type === "audio") ||
      (category === "Videos" && item.media_type === "video");

    return matchesSearch && matchesCategory;
  });

  
  



  if (loading) {
    return (
      <main style={{ 
        position: "fixed", inset: 0, zIndex: 99999, 
        background: "var(--ma-bg-primary)", // Automatically dark/light
        display: "flex", flexDirection: "column", 
        justifyContent: "center", alignItems: "center", 
        padding: "20px" 
      }}>
        
        <div style={{ 
          display: "flex", flexDirection: "column", alignItems: "center",
          animation: "fadeIn 0.5s ease-out", textAlign: "center" 
        }}>
          
          {/* OFFICIAL LOGO CARD */}
          <div style={{
            background: "#ffffff", // Always white so black text in logo is visible
            padding: "16px", 
            borderRadius: "20px", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)", // Stronger shadow for dark mode
            marginBottom: "32px",
            border: "1px solid var(--ma-border)" // Subtle border in light mode
          }}>
            <img 
              src="/music-antenna-logo.png" 
              alt="Music Antenna" 
              style={{ width: "200px", maxWidth: "75vw", height: "auto", display: "block" }} 
            />
          </div>

          {/* WELCOME MESSAGE */}
          <h1 style={{ 
            color: "var(--ma-text-primary)", // Black in Light, White in Dark
            fontSize: "28px", 
            fontWeight: "800", 
            margin: "0 0 8px 0", 
            letterSpacing: "-0.5px" 
          }}>
            Welcome to Music Antenna
          </h1>
          
          <p style={{ 
            color: "var(--ma-text-secondary)", // Grey in both modes
            fontSize: "15px", 
            margin: "0 0 40px 0" 
          }}>
            Your sound. Your world.
          </p>

          {/* PREMIUM SPINNER (High contrast in both modes) */}
          <div style={{ 
            width: "36px", height: "36px", 
            border: "3px solid rgba(150, 150, 150, 0.2)", // Visible grey track
            borderTop: "3px solid var(--ma-accent)", // Your pink brand color
            borderRadius: "50%", 
            animation: "spin 1s linear infinite",
            marginBottom: "16px"
          }}></div>
          
          <p style={{ 
            color: "var(--ma-text-secondary)", 
            fontSize: "13px", 
            margin: 0, 
            fontWeight: "600" 
          }}>
            Connecting securely...
          </p>

        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main
        className={
          "auth-page auth-screen " +
          (authTab === "creator" ? "auth-screen-creator" : "auth-screen-listener")
        }
      >
        <section className="auth-screen-card">
          <div className="auth-screen-brand">
            <img src="/music-antenna-logo.png" alt="Music Antenna" style={{ width: "100%", maxWidth: "180px", height: "auto", objectFit: "contain", margin: "0 auto 16px" }} />
            
          </div>
          


          
          


          {message && (
            <div className="auth-screen-message" role="alert">
              <span className="material-symbols-outlined">info</span>
              <span>{message}</span>
            </div>
          )}

{authTab === "listener" ? (
            <>
              {/* ===================== LISTENER SCREEN ===================== */}
              

              {mode === "login" ? (
                <form onSubmit={handleListenerLogin} className="auth-screen-form">
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <div className="auth-pw-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-pw-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </label>
                  {mode === "register" && (
                    <label style={{ marginTop: "16px", display: "block" }}>
                      <span>Confirm Password</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                    </label>
                  )}
                  <button type="submit" className="auth-screen-submit" disabled={busy}>
                    {busy ? "Please wait..." : "Sign in as Listener"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="auth-screen-form">
                  

                  

                  

                  
                  
                  
                  
                  {message && (
                    <div className={`auth-message-box ${message.toLowerCase().includes("error") || message.toLowerCase().includes("invalid") ? "error" : "success"}`}>
                      {message}
                    </div>
                  )}
                  <label>
                    <span>Username</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      maxLength={80}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <div className="auth-pw-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-pw-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="auth-screen-submit" disabled={busy}>
                    {busy ? "Please wait..." : "Join as Listener"}
                  </button>
                </form>
              )}

              <div className="auth-screen-links">
                {mode === "login" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType("listener");
                        setAuthTab("listener");
                        setMode("register");
                        setJustTriedRegister(false);
                        setShowPassword(false);
                        setMessage("");
                      }}
                    >
                      New listener? Sign up
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                    >
                      Reset password
                    </button>
                  
      {showMoreOptions && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2147483647, display: "flex", alignItems: "flex-end" }} onClick={() => setShowMoreOptions(false)}>
          <div style={{ background: "var(--ma-surface)", width: "100%", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", padding: "20px", paddingBottom: "40px" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ width: "40px", height: "4px", background: "#555", borderRadius: "2px", margin: "0 auto 20px" }}></div>
            
            <h3 style={{ color: "var(--ma-text)", margin: "0 0 20px 0", fontSize: "18px" }}>Video Options</h3>
            
            {/* Playback Speed */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "var(--ma-text-secondary, #666)", fontSize: "14px", marginBottom: "8px" }}>Playback Speed</p>
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 1.5, 2].map(speed => (
                  <button key={speed} onClick={() => {
                    if (videoRef.current) videoRef.current.playbackRate = speed;
                    if (audioRef.current) audioRef.current.playbackRate = speed;
                    setMessage(`Speed set to ${speed}x`);
                    setShowMoreOptions(false);
                  }} style={{ flex: 1, padding: "12px", background: "#333", color: "var(--ma-text)", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button onClick={() => { handleShare(activeMedia); setShowMoreOptions(false); }} style={{ width: "100%", padding: "16px", background: "#333", color: "var(--ma-text)", border: "none", borderRadius: "8px", marginBottom: "10px", textAlign: "left", fontSize: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              🔗 Copy / Share Link
            </button>
            
            <button onClick={() => { setMessage("Video reported. Thank you."); setShowMoreOptions(false); }} style={{ width: "100%", padding: "16px", background: "#333", color: "var(--ma-text)", border: "none", borderRadius: "8px", marginBottom: "10px", textAlign: "left", fontSize: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              ⚠️ Report Video
            </button>
            
            <button onClick={() => setShowMoreOptions(false)} style={{ width: "100%", padding: "16px", background: "transparent", color: "#ff365f", border: "1px solid #ff365f", borderRadius: "8px", marginTop: "10px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>
              Cancel
            </button>
            
          </div>
        </div>
      )}

    
      

    
      

      {showResetModal && createPortal(

        <div className="ma-modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="ma-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="ma-modal-title">Reset Password</h3>
            <p className="ma-modal-desc">Enter your email address and we will send you a link to reset your password.</p>
            <input
              type="email"
              className="ma-modal-input"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoFocus
            />
            <div className="ma-modal-actions">
              <button className="ma-modal-btn cancel" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="ma-modal-btn primary" onClick={submitPasswordReset}>Send Link</button>
            </div>
          </div>
        </div>
      ,
document.body
)}

      {showCreatorResetModal && createPortal(

        <div className="ma-modal-backdrop" onClick={() => setShowCreatorResetModal(false)}>
          <div className="ma-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="ma-modal-title">Reset Art ID & Password</h3>
            <p className="ma-modal-desc">Enter your Creator email address. We will send you a link to recover your Art ID and reset your password.</p>
            <form onSubmit={handleCreatorReset}>
              <input
                type="email"
                className="ma-modal-input"
                placeholder="Creator email address"
                value={creatorResetEmail}
                onChange={(e) => setCreatorResetEmail(e.target.value)}
                autoFocus
                required
              />
              <div className="ma-modal-actions">
                <button type="button" className="ma-modal-btn cancel" onClick={() => setShowCreatorResetModal(false)}>Cancel</button>
                <button type="submit" className="ma-modal-btn primary">Send Link</button>
              </div>
            </form>
          </div>
        </div>
      ,
document.body
)}

    
      

    
      {showResetModal && createPortal(
        <div className="ma-modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="ma-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="ma-modal-title">Reset Password</h3>
            <p className="ma-modal-desc">Enter your email address and we will send you a link to reset your password.</p>
            <form onSubmit={submitPasswordReset}>
              <input
                type="email"
                className="ma-modal-input"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoFocus
                required
              />
              <div className="ma-modal-actions">
                <button type="button" className="ma-modal-btn cancel" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="ma-modal-btn primary">Send Link</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showCreatorResetModal && createPortal(
        <div className="ma-modal-backdrop" onClick={() => setShowCreatorResetModal(false)}>
          <div className="ma-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="ma-modal-title">Reset Art ID & Password</h3>
            <p className="ma-modal-desc">Enter your Creator email address to recover your Art ID and reset your password.</p>
            <form onSubmit={handleCreatorReset}>
              <input
                type="email"
                className="ma-modal-input"
                placeholder="Creator email address"
                value={creatorResetEmail}
                onChange={(e) => setCreatorResetEmail(e.target.value)}
                autoFocus
                required
              />
              <div className="ma-modal-actions">
                <button type="button" className="ma-modal-btn cancel" onClick={() => setShowCreatorResetModal(false)}>Cancel</button>
                <button type="submit" className="ma-modal-btn primary">Send Link</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setJustTriedRegister(false);
                      setShowPassword(false);
                      setMessage("");
                    }}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>

              <div className="auth-screen-switch">
                <p>Are you a creator?</p>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthFields();
                    setAuthTab("creator");
                    setAccountType("artist");
                    setMode("login");
                    setJustTriedRegister(false);
                  }}
                >
                  <span style={{ color: "#FF365F", fontWeight: "700", textDecoration: "underline", fontSize: "14px" }}>Go to Creator sign in →</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ===================== CREATOR SCREEN ===================== */}

              {mode === "login" ? (
                <form onSubmit={handleCreatorLogin} className="auth-screen-form">
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <div className="auth-pw-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-pw-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="auth-screen-submit" disabled={busy}>
                    {busy ? "Please wait..." : "Sign in as Creator"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="auth-screen-form">
                  

                  

                  

                  <label>
                    <span>Artist name</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your artist name"
                      maxLength={80}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <div className="auth-pw-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-pw-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="auth-screen-submit" disabled={busy}>
                    {busy ? "Please wait..." : "Join as Creator"}
                  </button>
                </form>
              )}
              <div style={{ textAlign: "center", marginBottom: "20px" }}><span style={{ background: "rgba(255, 54, 95, 0.15)", color: "#FF365F", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px", border: "1px solid rgba(255, 54, 95, 0.3)" }}>CREATOR STUDIO PORTAL</span></div>

              <div className="auth-screen-links">
                {mode === "login" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType("artist");
                        setAuthTab("creator");
                        setMode("register");
                        setJustTriedRegister(false);
                        setShowPassword(false);
                        setMessage("");
                      }}
                    >
                      New creator? Sign up
                    </button>
                    <button  
                      type="button"
                      
                      onClick={() => setShowCreatorResetModal(true)}>Reset Art ID</button>

        {showCreatorResetModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 21474836479, background: "rgba(15, 15, 15, 0.95)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "400px", padding: "24px", background: "#1C1C1C", borderRadius: "16px", border: "1px solid var(--ma-border)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <h3 style={{ textAlign: "center", color: "#F1F1F1", marginBottom: "8px", fontSize: "20px" }}>Reset Art ID & Password</h3>
              <p style={{ textAlign: "center", color: "var(--ma-text-secondary)", marginBottom: "24px", fontSize: "14px" }}>Enter your Creator email to recover your Art ID and reset your password.</p>
              
              <form onSubmit={handleCreatorReset}>
                <input
                  type="email"
                  style={{ width: "100%", padding: "14px", borderRadius: "8px", background: "#272727", color: "var(--ma-text)", border: "1px solid var(--ma-border)", marginBottom: "20px", boxSizing: "border-box" }}
                  placeholder="Creator email address"
                  value={creatorResetEmail}
                  onChange={(e) => setCreatorResetEmail(e.target.value)}
                  required
                />
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setShowCreatorResetModal(false)} style={{ padding: "10px 16px", background: "transparent", color: "var(--ma-text-secondary)", border: "none", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ padding: "10px 16px", background: "#FF0033", color: "#FFF", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Send Link</button>
                </div>
              </form>
            </div>
          </div>
        )}


        


        

                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setJustTriedRegister(false);
                      setShowPassword(false);
                      setMessage("");
                    }}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>

              <div className="auth-screen-switch">
                <p>Are you a listener?</p>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthFields();
                    setAuthTab("listener");
                    setAccountType("listener");
                    setMode("login");
                    setJustTriedRegister(false);
                  }}
                >
                  <span style={{ color: "#FF365F", fontWeight: "700", textDecoration: "underline", fontSize: "14px" }}>← Go to Listener sign in</span>
                </button>
              </div>
            </>
          )}

          

          <p className="auth-screen-footnote">Secure accounts powered by Supabase.</p>
        </section>
      </main>
    );
  }

  const displayUser =
    session.user.user_metadata?.display_name ||
    session.user.email?.split("@")[0] ||
    "Listener";


  function handleClosePlayer() {
    setShowWatchPage(false);
  }

  function handleFirstPlay(e) {
    if (viewCountedRef.current || !activeMedia?.id) return;
    
    // 1. Don't count if the creator is watching their own video
    if (session?.user?.id === activeMedia.artist_id) return;

    // 2. Mark as triggered locally so multiple onPlay events don't stack
    viewCountedRef.current = true;
    
    // 3. Generate a unique session ID for this playback
    const sessionId = crypto.randomUUID();
    
    // 4. YouTube-style delay: Only count the view if they watch for 10 seconds
    const mediaEl = e.target;
    let viewTimer = setTimeout(async () => {
      // Ensure it's still playing and hasn't been paused/ended
      if (mediaEl && !mediaEl.paused && !mediaEl.ended) {
        try {
          // 5. Call the SECURE RPC function
          const { error } = await supabase.rpc('record_video_view', {
            p_media_id: activeMedia.id,
            p_session_id: sessionId
          });
          
          if (error) {
            console.warn("View not recorded:", error.message);
          } else {
            console.log("View recorded successfully!");
            // Update local UI so the user sees the count go up instantly
            setMedia(prev => prev.map(m => m.id === activeMedia.id ? { ...m, views: (m.views || 0) + 1 } : m));
            setActiveMedia(prev => prev && prev.id === activeMedia.id ? { ...prev, views: (prev.views || 0) + 1 } : prev);
          }
        } catch (err) {
          console.error("RPC Error:", err);
        }
      }
    }, 10000); // 10,000 milliseconds = 10 seconds

    // If they pause or close the video before 10 seconds, cancel the view
    const cancelView = () => clearTimeout(viewTimer);
    mediaEl.addEventListener('pause', cancelView, { once: true });
    mediaEl.addEventListener('ended', cancelView, { once: true });
  }

  function formatVoiceTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return (
    <div className="ma-app">

    <style>{`
      .yt-video-menu {
        color: #000000 !important;
      }
      .dark .yt-video-menu, [data-theme="dark"] .yt-video-menu {
        color: #ffffff !important;
      }
    `}</style>


    <style>{`
      * {
        -webkit-tap-highlight-color: transparent !important;
      }
    `}</style>


<style>{`/* PREMIUM_MEDIA_BADGES */
  .yt-duration {
    position: absolute !important;
    bottom: 8px !important;
    right: 8px !important;
    background-color: rgba(0, 0, 0, 0.7) !important;
    color: #ffffff !important;
    padding: 4px 8px !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
  }
`}</style>


<style>{`
  .yt-watch-action {
    -webkit-tap-highlight-color: transparent !important;
    transition: all 0.2s ease !important;
  }
  .yt-watch-action:active, .yt-watch-action:focus, .yt-watch-action:hover {
    background-color: var(--ma-surface, #f0f0f0) !important;
    color: var(--ma-text, #000) !important;
    outline: none !important;
    box-shadow: none !important;
  }
  /* If the Like button is active/liked, give it a soft pink background */
  .yt-watch-action.liked {
    background-color: rgba(255, 54, 95, 0.1) !important;
    color: #ff365f !important;
  }
`}</style>


<style>{`
  /* Tighten the gap between Action Buttons, Channel Row, and Comments */
  .yt-watch-actions { margin-bottom: 8px !important; }
  .yt-watch-channel { padding: 8px 0 !important; margin-bottom: 12px !important; }
`}</style>


<style>{`
  
`}</style>


<style>{`
  /* Watch Page Main Container */
  .yt-watch { background: var(--ma-bg, #fff) !important; color: var(--ma-text, #000) !important; }
  
  /* Video Title & Meta */
  .yt-watch-title { color: var(--ma-text, #000) !important; font-size: 20px !important; font-weight: 700 !important; margin: 8px 0 !important; line-height: 1.3 !important; }
  .yt-watch-meta { color: var(--ma-text-secondary, #666) !important; font-size: 13px !important; margin-bottom: 16px !important; }
  
  /* Action Buttons (Like, Share, Download) */
  .yt-watch-actions { display: flex !important; gap: 8px !important; overflow-x: auto !important; padding-bottom: 16px !important; border-bottom: 1px solid var(--ma-border, #e5e5e5) !important; margin-bottom: 16px !important; }
  .yt-watch-actions button { background: var(--ma-surface, #f2f2f2) !important; color: var(--ma-text, #000) !important; border: 1px solid var(--ma-border, #e5e5e5) !important; border-radius: 10px !important; padding: 8px 16px !important; font-weight: 600 !important; display: flex !important; align-items: center !important; gap: 6px !important; font-size: 14px !important; cursor: pointer !important; }
  
  /* Channel Row */
  .yt-watch-channel { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 12px 0 !important; border-bottom: 1px solid var(--ma-border, #e5e5e5) !important; margin-bottom: 24px !important; }
  .yt-watch-channel-name { color: var(--ma-text, #000) !important; font-weight: 700 !important; font-size: 16px !important; }
  .yt-watch-channel-sub { color: var(--ma-text-secondary, #666) !important; font-size: 13px !important; }
  
  /* Inline Comments Section */
  .yt-watch-comments-wrapper { background: var(--ma-surface, #f2f2f2) !important; border-radius: 16px !important; padding: 16px !important; }
  .yt-watch-comments-wrapper h3 { color: var(--ma-text, #000) !important; font-size: 15px !important; font-weight: 600 !important; }
  .yt-watch-comment-text { color: var(--ma-text, #000) !important; font-size: 14px !important; }
  
  /* Comment Input Box */
  .yt-watch-comment-input { background: var(--ma-bg, #fff) !important; color: var(--ma-text, #000) !important; border: 1px solid var(--ma-border, #e5e5e5) !important; border-radius: 12px !important; padding: 12px !important; }
`}</style>


<style>{`
  .premium-comment-input-wrap {
    transition: all 0.2s ease;
  }
  .premium-comment-input-wrap:focus-within {
    border-color: #ff365f !important;
    box-shadow: 0 0 0 3px rgba(255, 54, 95, 0.15) !important;
  }
`}</style>


<style>{`
  .yt-watch-subscribe.subscribed, .yt-you-btn-secondary {
    background-color: var(--ma-surface, #f0f0f0) !important;
    color: var(--ma-text, #000) !important;
    border: 1px solid var(--ma-border, #e5e5e5) !important;
  }
  .yt-watch-subscribe.subscribed:hover, .yt-you-btn-secondary:hover {
    background-color: var(--ma-bg-hover, #e5e5e5) !important;
  }
`}</style>


      


      

        {/* PERMANENT AUDIO PLAYER (Never stops on tab change) */}
        
      <header className="ma-header">
        <div className="ma-brand" style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: "4px" }} onClick={() => { closeAllOverlays(); setCategory("All"); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <img src="/music-antenna-logo.png" alt="" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
            </div>

        <div className="ma-search">
          <div className="ma-search-box">
            <span className="material-symbols-outlined ma-search-icon">search</span>
            <input aria-label="Search" placeholder="Search..." value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchStatusMsg(""); }} />
            
            {/* THE ROLLING SPINNER */}
            {searchLoading && (
              <span className="material-symbols-outlined ma-search-spinner" style={{ animation: "spin 1s linear infinite" }}>
                sync
              </span>
            )}
            
            {/* CLEAR BUTTON */}
            {search && !searchLoading && (
              <button className="ma-search-clear" onClick={() => setSearch("")} aria-label="Clear">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          
          <button className="ma-mic-btn" aria-label="Voice search" onClick={handleVoiceSearch}>
            <span className="material-symbols-outlined">mic</span>
          </button>
        </div>

        <div className="ma-user">
          <div style={{ position: "relative" }}>
            <button className="ma-icon-btn" aria-label="Notifications" onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotifications(); }}>
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className="yt-nav-badge" style={{ position: "absolute", top: 4, right: 4, background: "red", color: "var(--ma-text)", borderRadius: "10px", padding: "2px 6px", fontSize: "10px", fontWeight: "bold" }}>{unreadCount}</span>}
            </button>
            
      {activeNotification && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={() => setActiveNotification(null)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "85%", maxWidth: "340px", borderRadius: "16px", padding: "24px", border: "1px solid var(--ma-border, #e5e5e5)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ color: "#FF4E45", fontSize: "24px" }}>delete</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Comment Removed</h3>
            </div>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--ma-text-secondary, #666)", lineHeight: "1.5" }}>
              <strong style={{ color: "var(--ma-text, #000)" }}>{activeNotification.actor?.display_name || "Creator"}</strong> removed the comment you posted on their video.
            </p>
            <div style={{ padding: "12px", background: "var(--ma-surface, #f0f0f0)", borderRadius: "8px", borderLeft: "3px solid #FF4E45", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--ma-text-secondary, #888)", textTransform: "uppercase", fontWeight: "700" }}>Your Comment:</p>
              <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "var(--ma-text, #000)" }}>"{activeNotification.comment_text || "Content not available"}"</p>
            </div>
            <button onClick={() => setActiveNotification(null)} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "var(--ma-surface, #f0f0f0)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      
      {showClearNotifModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowClearNotifModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "85%", maxWidth: "320px", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700" }}>Clear Activity Log</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--ma-text-secondary, #666)", lineHeight: "1.4" }}>
              Are you sure you want to clear all notifications? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => setShowClearNotifModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border, #e5e5e5)", background: "transparent", color: "var(--ma-text, #000)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={async () => {
                await supabase.from("notifications").delete().eq("user_id", session.user.id);
                setNotifications([]);
                setUnreadCount(0);
                setShowClearNotifModal(false);
              }} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#ff365f", color: "#ffffff", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,54,95,0.3)" }}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showNotifications && createPortal(
        <section style={{ position: "fixed", inset: 0, zIndex: 21474836479, background: "var(--ma-bg-primary)", display: "flex", flexDirection: "column" }}>
          
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--ma-border)", background: "var(--ma-bg-primary)", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setShowNotifications(false)} style={{ background: "transparent", border: "none", color: "var(--ma-text-primary)", cursor: "pointer", display: "flex", padding: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
              </button>
              <h2 style={{ fontSize: "16px", margin: 0, fontWeight: "700", color: "var(--ma-text-primary)" }}>Activity Log</h2>
            </div>
            
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {notifications.length > 0 && (
                <button onClick={async () => {
                  if(window.confirm("Clear all notifications?")) {
                    await supabase.from("notifications").delete().eq("user_id", session.user.id);
                    setNotifications([]);
                    setUnreadCount(0);
                  }
                }} style={{ background: "transparent", border: "none", color: "#FF4E45", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* COMPACT LIST */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", paddingBottom: "160px" }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "var(--ma-text-secondary)", marginBottom: "12px" }}>history</span>
                <h3 style={{ color: "var(--ma-text-primary)", margin: "0 0 4px 0", fontSize: "15px" }}>No activity yet</h3>
                <p style={{ color: "var(--ma-text-secondary)", fontSize: "13px", margin: 0 }}>Every like, comment, and subscriber will be recorded here.</p>
              </div>
            ) : (
              notifications.map(n => {
                if (!n || !n.id || !n.type) return null;

                const isSelected = selectedNotifs.includes(n.id);
                const actorName = n.actor?.display_name || "Someone";
                const date = new Date(n.created_at);
                const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

                let icon = "notifications";
                let message = "";
                let actionColor = "#FF365F";

                switch(n.type) {
                  case "like": icon = "thumb_up"; message = `liked your video.`; actionColor = "#3EA6FF"; break;
                  case "comment": icon = "comment"; message = `commented on your video.`; actionColor = "#2BA640"; break;
                  case "subscribe": icon = "person_add"; message = `subscribed to your channel.`; actionColor = "#FF365F"; break;
                  case "new_video": icon = "video_library"; message = `released a new video. Tap play to watch.`; actionColor = "#F5A623"; break;
                  case "upload": icon = "upload"; message = `Your upload was successful.`; actionColor = "#2BA640"; break;
                  case "comment_deleted": icon = "delete"; message = `removed your comment.`; actionColor = "#FF4E45"; break;
                  default: icon = "info"; message = `interacted with your content.`;
                }

                return (
                  <div key={n.id} style={{ display: "flex", alignItems: "center", background: isSelected ? "rgba(255,54,95,0.1)" : "var(--ma-bg-secondary)", border: `1px solid ${isSelected ? "var(--ma-accent)" : "transparent"}`, borderLeft: !n.is_read ? "3px solid var(--ma-accent)" : "3px solid transparent", borderRadius: "8px", marginBottom: "8px", padding: "10px 12px" }}>
                    
                    {/* Checkbox */}
                    <div onClick={() => {
                      setSelectedNotifs(prev => isSelected ? prev.filter(id => id !== n.id) : [...prev, n.id]);
                    }} style={{ cursor: "pointer", marginRight: "10px", display: "flex" }}>
                      <span className="material-symbols-outlined" style={{ color: isSelected ? "var(--ma-accent)" : "var(--ma-text-secondary)", fontSize: "18px" }}>
                        {isSelected ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </div>

                    {/* CLICKING THE CARD ONLY MARKS AS READ */}
                    <div onClick={async () => {
                      if (!n.is_read) {
                        await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                      }
                    }} style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: 0 }}>
                      
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${actionColor}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ma-bg-hover)" }}>
                        {n.actor?.avatar_url ? <img src={n.actor.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span className="material-symbols-outlined" style={{ color: actionColor, fontSize: "16px" }}>person</span>}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <div style={{ fontSize: "13px", color: "var(--ma-text-primary)", lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <strong>{actorName}</strong> {message}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--ma-text-secondary)", marginTop: "2px" }}>{dateStr}</span>
                      </div>
                    </div>

                    {/* EXPLICIT PLAY BUTTON */}
                    {n.media_id && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setShowNotifications(false);
                        const found = media.find(m => m.id === n.media_id);
                        if (found) openPlayer(found);
                        else setMessage("Video unavailable.");
                      }} style={{ background: "transparent", border: "none", color: "var(--ma-accent)", cursor: "pointer", display: "flex", padding: "4px", marginLeft: "8px", flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>play_circle</span>
                      </button>
                    )}

                    {/* DELETE BUTTON */}
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from("notifications").delete().eq("id", n.id);
                      setNotifications(prev => prev.filter(x => x.id !== n.id));
                      setSelectedNotifs(prev => prev.filter(id => id !== n.id));
                    }} style={{ background: "transparent", border: "none", color: "var(--ma-text-secondary)", cursor: "pointer", display: "flex", padding: "4px", marginLeft: "8px", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 🎵 INJECTED MINI PLAYER */}
          <div onClick={(e) => e.stopPropagation()}>
             {activeMedia && !showWatchPage && (
        <div 
          className={"yt-mini-player" + (navVisible || isDragging || miniPlayerPos ? "" : " yt-mini-hidden") + ((!isPlaying || !isScrolling) && !isDragging ? " is-hidden" : "") + (isDragging ? " yt-mini-dragging" : "")}
          style={{
            bottom: miniPlayerPos ? 'auto' : '72px',
            left: miniPlayerPos ? `${miniPlayerPos.left}px` : '16px',
            top: miniPlayerPos ? `${miniPlayerPos.top}px` : 'auto',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          
          <div className="yt-mini-cover" onClick={() => setShowWatchPage(true)}>
            {activeMedia.thumbnailUrl ? (
              <img loading="lazy" src={activeMedia.thumbnailUrl} alt="" style={{ pointerEvents: "none" }} />
            ) : (
              <div className="yt-mini-cover-fallback">♫</div>
            )}
          </div>

          <div className="yt-mini-controls">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const mediaEl = activeMedia.media_type === "audio" ? audioRef.current : videoRef.current;
                if (mediaEl) {
                  if (mediaEl.paused) mediaEl.play();
                  else mediaEl.pause();
                }
              }} 
              className="yt-mini-play-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1", pointerEvents: "none" }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            
            
          </div>

        </div>
      )}
          </div>

        </section>,
        document.body
      )}
          </div>

          <div className="ma-avatar-wrap">
            <button className="ma-avatar-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Account">
              {profile?.avatar_url ? (
                <img className="ma-avatar-img" src={profile.avatar_url} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <span className="ma-avatar">{displayUser.charAt(0).toUpperCase()}</span>
              )}
            </button>

            {menuOpen && (
              <>
                <div className="ma-menu-backdrop" onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999, backdropFilter: "blur(2px)" }} />
                <div className="ma-avatar-menu" role="menu" style={{ position: "fixed", top: "60px", right: "8px", height: "auto", maxHeight: "80vh", width: "130px", background: "var(--ma-bg, #ffffff)", display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 100000, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "8px", padding: "4px 0", border: "1px solid var(--ma-border, #e5e5e5)" }}>
 <style>{`.ma-avatar-menu button { padding: 6px 10px !important; font-size: 11px !important; gap: 8px !important; } .ma-avatar-menu .material-symbols-outlined { font-size: 16px !important; } .ma-avatar-menu-header { padding: 6px 10px !important; padding-right: 24px !important; gap: 8px !important; } .ma-avatar-menu-img { width: 24px !important; height: 24px !important; } .ma-avatar-menu-header strong { font-size: 12px !important; } .ma-avatar-menu-header span { font-size: 10px !important; } .ma-avatar-menu-line { margin: 4px 0 !important; } .ma-avatar-menu div[style*="APPEARANCE"] { font-size: 9px !important; padding: 4px 10px !important; } .ma-avatar-menu div[style*="display: flex"] button { font-size: 10px !important; padding: 4px 0 !important; }`}</style>
                  <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: "4px", right: "4px", background: "transparent", border: "none", color: "var(--ma-text-secondary, #606060)", cursor: "pointer", padding: "4px", zIndex: 100001 }}><span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span></button>
                  <div className="ma-avatar-menu-header" style={{ paddingRight: "20px" }}>
                    {profile?.avatar_url ? (
                      <img className="ma-avatar-menu-img" src={profile.avatar_url} alt="" />
                    ) : (
                      <span className="ma-avatar-menu-img ma-avatar-menu-placeholder">
                        {displayUser.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <strong>{profile?.display_name || displayUser}</strong>
                      <span>@{profile?.username || profile?.display_name || "music-antenna"}</span>
                    </div>
                  </div>
                  <div className="ma-avatar-menu-line" />
                  <button style={{ display: profile?.role === "artist" ? "flex" : "none", alignItems: "center", gap: "10px", padding: "10px 8px", fontSize: "13px", fontWeight: "500", color: "var(--ma-text, #000)", background: "transparent", border: "none", borderRadius: "8px", cursor: "pointer", textAlign: "left" }} onClick={() => { setShowAnalytics(false);  setMenuOpen(false); setShowAccountPage(true); setShowProfileEditor(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <span className="material-symbols-outlined">account_circle</span> Your channel
                  </button>
                  <button onClick={() => { setShowAnalytics(false);  setMenuOpen(false); setProfileName(profile?.username || profile?.display_name || ""); setProfileBio(profile?.bio || ""); setShowAccountPage(true); setShowProfileEditor(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <span className="material-symbols-outlined">edit</span> Edit profile
                  </button>
                  
                  <div className="ma-avatar-menu-line" />
                  <div style={{ padding: "8px 16px" }}>
                    <div style={{ fontSize: "12px", color: "var(--ma-text-secondary)", marginBottom: "8px", fontWeight: "bold" }}>APPEARANCE</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setTheme('light')} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--ma-border)", background: theme === 'light' ? 'var(--ma-accent)' : 'var(--ma-bg-hover)', color: theme === 'light' ? '#fff' : 'var(--ma-text-primary)', cursor: "pointer", fontWeight: "bold" }}>Light</button>
                      <button onClick={() => setTheme('dark')} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--ma-border)", background: theme === 'dark' ? 'var(--ma-accent)' : 'var(--ma-bg-hover)', color: theme === 'dark' ? '#fff' : 'var(--ma-text-primary)', cursor: "pointer", fontWeight: "bold" }}>Dark</button>
                      <button onClick={() => setTheme('device')} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--ma-border)", background: theme === 'device' ? 'var(--ma-accent)' : 'var(--ma-bg-hover)', color: theme === 'device' ? '#fff' : 'var(--ma-text-primary)', cursor: "pointer", fontWeight: "bold" }}>Auto</button>
                    </div>
                  </div>
                  <div className="ma-avatar-menu-line" />
                  <button onClick={() => { setShowAnalytics(false);  setMenuOpen(false); handleLogout(); }}>
                    <span className="material-symbols-outlined">logout</span> Sign out
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={"ma-layout" + (sidebarCollapsed ? " ma-layout-collapsed" : "") + ((showAccountPage || showChannelPage || showBecomeArtistForm || (activeMedia && showWatchPage) || showManagePage || showHistoryPage || showLikedPage || showAllPlaylists || selectedPlaylist || showAnalytics || showSubscriptionsPage) ? " ma-layout-hidden" : "")}>
        <aside className="ma-sidebar">
          <button
            className="ma-nav-item selected"
            onClick={() => { setShowSubscriptionsFeed(false); setCategory("All"); }}
          >
            <span>⌂</span> Home
          </button>

          <button
            className="ma-nav-item"
            onClick={() => { setShowSubscriptionsFeed(false); setCategory("Music"); }}
          >
            <span>♫</span> Music
          </button>

          <button
            className="ma-nav-item"
            onClick={() => { setShowSubscriptionsFeed(false); setCategory("Videos"); }}
          >
            <span>▶</span> Videos
          </button>

          <div className="ma-sidebar-line" />

          {profile?.role !== "artist" && (
            <button
              className="ma-nav-item"
              onClick={handleBecomeArtist}
              disabled={artistLoading || !profile}
            >
              <span>🎤</span>{" "}
              {artistLoading ? "Please wait..." : "Become an Artist"}
            </button>
          )}

          {profile?.role === "artist" && (
            <button
              className="ma-nav-item"
              onClick={() => {
                setShowArtistStudio(!showArtistStudio);
                setShowUpload(true);
              }}
            >
              <span>🎚</span> Artist Studio
            </button>
          )}

          <button
            className="ma-nav-item"
            onClick={() => setShowUpload(!showUpload)}
          >
            <span>＋</span> Upload media
          </button>

          <div className="ma-sidebar-bottom">
            <span className="ma-brand-icon">♫</span>
            <p></p>
            <small>Your sound. Your world.</small>
          </div>
        </aside>

        <main className="ma-main" id="home">
          {showArtistStudio && profile?.role === "artist" && (
            <section className="ma-upload-panel" id="media-upload-panel">
              <div className="ma-section-heading ma-hide-desktop-only">
                <div>
                  <p className="ma-kicker">ARTIST STUDIO</p>
                  <h2>Welcome, {profile.display_name || displayUser}!</h2>
                </div>
                <button
                  className="ma-close"
                  onClick={() => setShowArtistStudio(false)}
                  aria-label="Close Artist Studio"
                >
                  ×
                </button>
              </div>

              <p className="ma-muted">
                Your artist profile is active. Upload your music or videos
                and share your work with  listeners.
              </p>

              <button
                className="ma-primary"
                onClick={() => {
                  setShowUpload(true);
                  document
                    .getElementById("media-upload-panel")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Upload music or video →
              </button>
            </section>
          )}

          <section className="ma-hero ma-discovery-hero ma-hero-hidden">
            <div className="ma-discovery-copy">
              <p className="ma-hero-label">MUSIC ANTENNA</p>
              <h1>Discover your sound.</h1>
              <p>Search for any artist, song or music video to get started.</p>
              <div className="ma-discovery-actions">
                <button className="ma-primary"
                  onClick={() => setShowUpload(true)}>
                  ＋ Upload media
                </button>
                <button className="ma-discovery-browse"
                  onClick={() => document.getElementById("media-feed")
                    ?.scrollIntoView({ behavior: "smooth" })}>
                  Browse latest ↓
                </button>
              </div>
            </div>
            <div className="ma-hero-art" aria-hidden="true">
              <span>♫</span><i>♪</i><b>♬</b>
            </div>
          </section>


          {showUpload && (
<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "var(--ma-bg)", overflowY: "auto" }}>
        <style>{`
          .yt-upload-form input, .yt-upload-form textarea, .yt-upload-form select {
            background-color: var(--ma-bg-secondary) !important;
            color: var(--ma-text-primary) !important;
            border: 1px solid var(--ma-border) !important;
            border-radius: 8px !important;
            padding: 12px !important;
            width: 100%;
            box-sizing: border-box;
          }
          .yt-upload-form input::placeholder, .yt-upload-form textarea::placeholder {
            color: var(--ma-text-secondary) !important;
          }
          .yt-upload-form label span {
            color: var(--ma-text-primary) !important;
            font-weight: 600;
            font-size: 14px;
          }
        `}</style>

            
<style>{`
  /* Main Upload Screen Background */
  .yt-upload { background: var(--ma-bg, #fff) !important; color: var(--ma-text, #000) !important; }
  .yt-upload-heading { color: var(--ma-text, #000) !important; }
  
  /* Dropzone */
  .yt-upload-dropzone { 
    background: var(--ma-surface, #f9f9f9) !important; 
    border: 2px dashed var(--ma-border, #e5e5e5) !important; 
    color: var(--ma-text, #000) !important; 
  }
  .yt-upload-dropzone p { color: var(--ma-text, #000) !important; }
  .yt-upload-dropzone-sub { color: var(--ma-text-secondary, #666) !important; }
  
  /* The 'Select Files' Button (Turn it pink) */
  .yt-upload-select {
    background: #ff365f !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(255,54,95,0.3) !important;
  }
  
  /* Input Fields (Title, Description, Category, Artist) */
  .yt-upload-field input, 
  .yt-upload-field textarea, 
  .yt-upload-field select {
    background: var(--ma-surface, #f2f2f2) !important;
    color: var(--ma-text, #000) !important;
    border: 1px solid var(--ma-border, #e5e5e5) !important;
    outline: none !important;
  }
  
  /* Input Labels */
  .yt-upload-field span {
    color: var(--ma-text, #000) !important;
  }
  
  /* Top Bar Close Button */
  .yt-upload-topbar .yt-icon-btn {
    color: var(--ma-text, #000) !important;
  }
`}</style>

          <section className="yt-upload">
              <div className="yt-upload-topbar">
                <button
                  className="yt-icon-btn"
                  aria-label="Close"
                  onClick={() => setShowUpload(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <h2 className="yt-upload-heading">Upload media</h2>
                <div className="yt-upload-topbar-right" />
              </div>

              
<style>{`/* V2_UPLOAD_OVERRIDES */
  /* 1. Fix the weird blue Select Files button */
  label.yt-upload-select {
    background-color: #ff365f !important;
    border-radius: 8px !important;
    padding: 12px 24px !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(255,54,95,0.3) !important;
  }
  label.yt-upload-select span {
    background-color: transparent !important;
    color: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* 2. Fix the Thumbnail box */
  label.yt-upload-thumb {
    background-color: var(--ma-surface, #f9f9f9) !important;
    border: 2px dashed var(--ma-border, #ccc) !important;
    color: var(--ma-text-secondary, #666) !important;
  }
  label.yt-upload-thumb span {
    color: var(--ma-text-secondary, #666) !important;
  }

  /* 3. Fix the Visibility/Radio box */
  div.yt-upload-publish {
    background-color: var(--ma-surface, #f9f9f9) !important;
    border: 1px solid var(--ma-border, #e5e5e5) !important;
    color: var(--ma-text, #000) !important;
    border-radius: 12px !important;
    padding: 16px !important;
  }
  span.yt-upload-publish-label {
    color: var(--ma-text, #000) !important;
  }
  label.yt-upload-radio span {
    color: var(--ma-text, #000) !important;
  }
  input.yt-upload-datetime {
    background-color: var(--ma-bg, #fff) !important;
    color: var(--ma-text, #000) !important;
    border: 1px solid var(--ma-border, #e5e5e5) !important;
  }

  /* 4. Fix Checkbox Labels */
  label.yt-upload-checkbox {
    color: var(--ma-text, #000) !important;
  }
`}</style>

          
<style>{`/* V3_DROPZONE_RESIZE */
  /* 1. Shrink the overall dashed box */
  div.yt-upload-dropzone {
    padding: 24px 16px !important;
    gap: 6px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 12px !important;
  }
  
  /* 2. Shrink the upload icon */
  div.yt-upload-dropzone > .material-symbols-outlined {
    font-size: 32px !important;
    margin-bottom: 4px !important;
    color: var(--ma-text-secondary, #666) !important;
  }

  /* 3. Shrink the text inside */
  div.yt-upload-dropzone p {
    font-size: 14px !important;
    margin: 0 !important;
    line-height: 1.4 !important;
    text-align: center !important;
  }
  div.yt-upload-dropzone p.yt-upload-dropzone-sub {
    font-size: 12px !important;
    color: var(--ma-text-secondary, #666) !important;
  }

  /* 4. Make the pink button sleeker */
  label.yt-upload-select {
    padding: 10px 24px !important;
    margin-top: 12px !important;
    font-size: 14px !important;
    border-radius: 8px !important;
  }
  label.yt-upload-select span {
    font-size: 14px !important;
    font-weight: 600 !important;
  }
`}</style>

          <form className="yt-upload-form theme-aware-form" onSubmit={handleUpload}>
                <div className="yt-upload-dropzone">
                  <span className="material-symbols-outlined">upload</span>
                  <p>Drag and drop video or audio files</p>
                  <p className="yt-upload-dropzone-sub">
                    Your files stay private until you publish
                  </p>
                  <label className="yt-upload-select">
                    <input
                      id="media-file"
                      type="file"
                      accept="audio/*,video/*,.m4a"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      required
                    />
                    <span>Select files</span>
                  </label>
                  {uploadFile && (
                    <p className="yt-upload-chosen">
                      <span className="material-symbols-outlined">
                        {uploadFile.type.startsWith("video/") ? "movie" : "music_note"}
                      </span>
                      {uploadFile.name} ({Math.round(uploadFile.size / 1024 / 1024 * 10) / 10} MB)
                    </p>
                  )}
                </div>

                <label className="yt-upload-field">
                  <span>Title <b>*</b></span>
                  <input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    maxLength={200}
                    placeholder="Add a title that describes your upload"
                    required
                  />
                </label>

                <label className="yt-upload-field">
                  <span>Description</span>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Tell listeners about your upload"
                    rows={4}
                  />
                </label>

                <label className="yt-upload-field">
                  <span>Category</span>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                  >
                    <option>Music</option>
                    <option>DJ Mix</option>
                    <option>Gospel</option>
                    <option>Comedy</option>
                    <option>Interview</option>
                    <option>Podcast</option>
                    <option>News</option>
                    <option>Sports</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="yt-upload-field">
                  <span>Blocked Words (Optional)</span>
                  <input 
                    value={uploadBlockedWords} 
                    onChange={(e) => setUploadBlockedWords(e.target.value)} 
                    placeholder="E.g. scam, ugly, hate (comma separated)" 
                    maxLength={100} 
                  />
                  <small className="yt-upload-hint">Comments containing these words will be automatically blocked on this video.</small>
                </label>

                <label className="yt-upload-field">
                  <span>Artist name</span>
                  <input
                    value={uploadArtistName}
                    onChange={(e) => setUploadArtistName(e.target.value)}
                    placeholder={profile?.display_name || "Your artist name"}
                    maxLength={80}
                  />
                </label>

                {uploadFile && uploadFile.type.startsWith("audio/") && (
                  <label className="yt-upload-field">
                    <span>Producer name</span>
                    <input
                      value={uploadProducerName}
                      onChange={(e) => setUploadProducerName(e.target.value)}
                      placeholder="Producer / beatmaker"
                      maxLength={80}
                    />
                  </label>
                )}

                <div className="yt-upload-field">
                  <span>
                    {uploadFile && uploadFile.type.startsWith("audio/")
                      ? "Cover image"
                      : "Thumbnail"}
                  </span>
                  <label className="yt-upload-thumb">
                    <input
                      id="media-thumb"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setUploadThumbnailFile(e.target.files?.[0] || null)}
                    />
                    <span className="material-symbols-outlined">image</span>
                    <span className="yt-upload-thumb-text">
                      {uploadThumbnailFile
                        ? uploadThumbnailFile.name
                        : "Upload a picture (optional)"}
                    </span>
                  </label>
                  <small className="yt-upload-hint">
                    {uploadFile && uploadFile.type.startsWith("audio/")
                      ? "Shown on the watch page and player. 16:9 recommended."
                      : "Falls back to the video's first frame if not provided."}
                  </small>
                </div>

                <label className="ma-checkbox yt-upload-checkbox">
                  <input type="checkbox" checked={isShortUpload} onChange={(e) => setIsShortUpload(e.target.checked)} />
                  Upload as a Short (Vertical)
                </label>
                <label className="ma-checkbox yt-upload-checkbox">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                  />
                  Allow downloads
                </label>

                <div className="yt-upload-publish">
                  <span className="yt-upload-publish-label">Visibility</span>
                  <div className="yt-upload-radio-row">
                    <label className="yt-upload-radio">
                      <input
                        type="radio"
                        name="publish-mode"
                        value="now"
                        checked={uploadScheduleMode === "now"}
                        onChange={() => setUploadScheduleMode("now")}
                      />
                      <span>Publish now</span>
                    </label>
                    <label className="yt-upload-radio">
                      <input
                        type="radio"
                        name="publish-mode"
                        value="schedule"
                        checked={uploadScheduleMode === "schedule"}
                        onChange={() => setUploadScheduleMode("schedule")}
                      />
                      <span>Schedule</span>
                    </label>
                  </div>

                  {uploadScheduleMode === "schedule" && (
                    <input
                      className="yt-upload-datetime"
                      type="datetime-local"
                      value={uploadScheduledAt}
                      onChange={(e) => setUploadScheduledAt(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="yt-upload-actions">
                  <button
                    type="button"
                    className="yt-upload-cancel"
                    onClick={() => setShowUpload(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="yt-upload-submit"
                    disabled={busy}
                  >
                    {busy
                      ? "Please wait..."
                      : uploadScheduleMode === "schedule"
                        ? "Schedule"
                        : "Publish"}
                  </button>
                </div>
              </form>
            </section>
          
</div>
)}

          {false && (
            <section className="ma-player-panel">
              <button
                className="ma-back"
                onClick={() => setActiveMedia(null)}
              >
                ← Back to feed
              </button>

              {activeMedia.playbackUrl ? (
                activeMedia.media_type === "video" ? (
                  <video
                    className="ma-player"
                    src={activeMedia.playbackUrl}
                    poster={activeMedia.thumbnailUrl || undefined}
                    controls
                    playsInline
                    autoPlay
                    preload="metadata"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="ma-audio-player">
                    <div className="ma-audio-art">♫</div>
                    <audio
                      src={activeMedia.playbackUrl}
                      controls
                      autoPlay
                    />
                  </div>
                )
              ) : (
                <p className="ma-message">
                  Playback is unavailable. Check the storage bucket policies
                  and media storage path.
                </p>
              )}

              <h2>{activeMedia.title}</h2>
              <p className="ma-muted">
                {activeMedia.description || "No description provided."}
              </p>

              <div className="ma-player-actions">
                <button
                  className="ma-secondary"
                  onClick={async () => {
                    const shareUrl = window.location.href.split("#")[0];
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setMessage("Page link copied. Share it with your friends.");
                    } catch {
                      setMessage("Copy this page address to share it.");
                    }
                  }}
                >
                  ↗ Share page
                </button>
              </div>
            </section>
          )}

          <section className="ma-feed-section" id="media-feed">
            <div className="ma-section-heading ma-hide-desktop-only">
              <div>
                <p className="ma-kicker">THE COMMUNITY</p>
                <h2>{category === "All" ? "Explore media" : category}</h2>
              </div>
              <button
                className="ma-refresh"
                onClick={loadMedia}
                disabled={feedLoading}
              >
                ↻ Refresh
              </button>
            </div>

            
        {showSubscriptionsFeed && profile?.role === 'artist' && (
          <div style={{ display: 'flex', gap: '10px', margin: '10px 20px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
            <button onClick={() => setSubsTab('feed')} style={{ flex: 1, padding: '10px', background: subsTab === 'feed' ? '#ff365f' : '#212121', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>My Feed</button>
            <button onClick={() => setSubsTab('subscribers')} style={{ flex: 1, padding: '10px', background: subsTab === 'subscribers' ? '#ff365f' : '#212121', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>My Subscribers</button>
          </div>
        )}

        
          
          
          
          
          
          
          {(searchStatusMsg || search.trim() !== "") && (
            <div className="ma-inline-message">
              <span className="material-symbols-outlined">
                {searchStatusMsg.includes("Listening") ? "mic" : searchStatusMsg.includes("error") ? "error" : "search"}
              </span>
              <span>
                {searchStatusMsg || (
                  visibleMedia.length === 0 
                    ? `No results found for "${search}"` 
                    : `Found ${visibleMedia.filter(i => i.media_type === 'audio').length} audio and ${visibleMedia.filter(i => i.media_type === 'video').length} video${visibleMedia.filter(i => i.media_type === 'video').length > 1 ? 's' : ''} for "${search}"`
                )}
              </span>
            </div>
          )}
          
          {message && message.includes("Welcome back") && <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-4 mt-2 mb-2">{message}</p>}
          
<style>{`
  /* Force the active filter chip to be brand pink */
  .yt-chip.yt-chip-active {
    background-color: #ff365f !important;
    color: #ffffff !important;
    border-color: #ff365f !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(255, 54, 95, 0.3) !important;
  }
  
  /* Ensure the inactive chips have a clean, theme-aware background */
  .yt-chip:not(.yt-chip-active) {
    background-color: var(--ma-surface, #f2f2f2) !important;
    color: var(--ma-text, #000) !important;
    border: 1px solid var(--ma-border, #e5e5e5) !important;
  }
`}</style>

          <div className="yt-chips">
              {["All", "Music", "Videos", "Shorts"].map((c) => (
                <button
                  key={c}
                  className={"yt-chip" + (category === c ? " yt-chip-active" : "")}
                  onClick={() => {
                    setCategory(c);
                    
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            

            
        {showSubscriptionsFeed && subsTab === 'subscribers' ? (
          <div style={{ padding: '20px', paddingBottom: '100px' }}>
            {mySubscribers.length === 0 ? (
              <div className="ma-empty">
                <h3>No subscribers yet</h3>
                <p>When people subscribe to your channel, they will appear here.</p>
              </div>
            ) : (
              mySubscribers.map(sub => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {sub.avatar_url ? (
                      <img src={sub.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {(sub.display_name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{sub.username || sub.display_name || "User"}</span>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: sub.role === 'artist' ? '#ff365f' : '#333', color: 'white', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {sub.role === 'artist' ? 'Creator' : 'Listener'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Subscribed to you</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if(window.confirm("Remove this subscriber? (They will be unsubscribed)")) {
                      await supabase.from("subscriptions").delete().eq("channel_id", session.user.id).eq("subscriber_id", sub.id);
                      setMySubscribers(prev => prev.filter(x => x.id !== sub.id));
                      setMessage("Subscriber removed.");
                    }
                  }} style={{ background: "transparent", border: "none", color: "#ff365f", cursor: "pointer", padding: "8px" }}>
                    <span className="material-symbols-outlined">person_remove</span>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : feedLoading ? (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Thumbnail Skeleton */}
                    <div className="ma-skeleton" style={{ width: "100%", height: "220px", borderRadius: "12px" }}></div>
                    
                    {/* Info Skeleton */}
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div className="ma-skeleton" style={{ width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0 }}></div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div className="ma-skeleton" style={{ width: "70%", height: "16px", borderRadius: "4px" }}></div>
                        <div className="ma-skeleton" style={{ width: "40%", height: "12px", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleMedia.length === 0 ? (
              <div className="ma-empty">
                <span className="ma-empty-icon">♫</span>
                <h3>
                  {search ? "No matching media found" : "Discover your sound"}
                </h3>
                <p>
                  {search
                    ? "Try another search term."
                    : "Search for an artist, song or music video. Newly published tracks and videos will appear here."}
                </p>
                {!search && (
                  <button
                    className="ma-primary"
                    onClick={() => setShowUpload(true)}
                  >
                    ＋ Upload media
                  </button>
                )}
              </div>
            ) : (
              <div className="ma-media-grid">
                {visibleMedia.map((item) => (
                  <article className="yt-video" key={item.id}>
                    <button
                      className="yt-thumb"
                      onClick={() => openPlayer(item)}
                      aria-label={"Play " + item.title}
                    >
                      {item.thumbnailUrl ? (
                        <img loading="lazy" src={item.thumbnailUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="yt-thumb-fallback">
                          <span>{item.media_type === "video" ? "▶" : "♫"}</span>
                        </div>
                      )}
                      <span className="yt-duration">
                        {item.media_type === "video" ? "VIDEO" : "AUDIO"}
                      </span>
                    </button>

                    <div className="yt-video-row" style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "12px" }}>
                      <div 
                        className="yt-video-avatar" 
                        onClick={(e) => { e.stopPropagation(); openChannel(item.artist_id); }} 
                        style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, cursor: "pointer", background: "#ff365f", display: "grid", placeItems: "center", color: "var(--ma-text)", fontSize: "16px", fontWeight: "bold" }}
                      >
                        {item.profiles?.avatar_url ? (
                          <img loading="lazy" src={item.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          (item.profiles?.display_name || "M").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="yt-video-info" style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="yt-video-title" style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "var(--ma-text, #000)", lineHeight: "1.3", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.title}
                        </h3>
                        <p 
                          className="yt-video-channel" 
                          onClick={(e) => { e.stopPropagation(); openChannel(item.artist_id); }} 
                          style={{ margin: "0 0 2px 0", fontSize: "12px", color: "var(--ma-text-secondary, #666)", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {item.profiles?.display_name || "Unknown Artist"}
                        </p>
                        <p className="yt-video-meta" style={{ margin: 0, fontSize: "11px", color: "var(--ma-text-secondary, #888)" }}>
                          {item.views || 0} views • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "auto" }}>
                        <button className="yt-video-menu" aria-label="More" onClick={(e) => { e.stopPropagation(); e.preventDefault();  setShowMoreMenu(item); }} style={{ background: "red", color: "var(--ma-text)", padding: "10px", fontSize: "20px", zIndex: 99999, position: "relative" }}>⋮</button>
                      </div>
                    </div>
                  </article>
                ))}
                
                {/* Load More Button */}
                {visibleMedia.length >= feedLimit && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", width: "100%" }}>
                    <button 
                      onClick={() => setFeedLimit(prev => prev + 15)} 
                      style={{ padding: "12px 24px", background: "var(--ma-surface, #f0f0f0)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", borderRadius: "24px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
                    >
                      Load More Videos
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="ma-footer">
            <span>♫ </span>
            <span>Your sound. Your world.</span>
          </footer>
        </main>
      </div>


      {activeMedia && (
        <section className={"yt-watch" + (!showWatchPage ? " yt-watch-minimized" : "")}>
          <div className="yt-watch-topbar">
            <button className="yt-icon-btn yt-watch-back" aria-label="Back"
              onClick={() => setShowWatchPage(false)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="yt-watch-topbar-right">
              <button className="yt-icon-btn" aria-label="Search"
                onClick={() => { setActiveMedia(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="yt-icon-btn" aria-label="More" onClick={(e) => { e.stopPropagation(); setShowMoreMenu(activeMedia); }}>
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>

          <div className="yt-watch-player">
            
            {activeMedia.playbackUrl ? (
              activeMedia.media_type === "video" ? (
                <video
                  onPlay={handleFirstPlay} onEnded={handleVideoEnded}
                  className="yt-watch-video"
                  src={activeMedia.playbackUrl}
                  poster={activeMedia.thumbnailUrl || undefined}
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="yt-watch-audio">
                  <div className="yt-watch-audio-art">
                    {activeMedia.thumbnailUrl ? (
                      <img loading="lazy" src={activeMedia.thumbnailUrl} alt="" />
                    ) : (
                      <img src="/logo.png" alt="" style={{ height: "36px", width: "auto", objectFit: "contain", borderRadius: "6px" }} />
                    )}
                  </div>
                  <audio src={activeMedia.playbackUrl} controls autoPlay onPlay={handleFirstPlay} onEnded={handleVideoEnded} />
                </div>
              )
            ) : (
              <p className="yt-watch-error">This item's playback URL is missing.</p>
            )}
          </div>

          <div className="yt-watch-body">
            <h1 className="yt-watch-title">{activeMedia.title}</h1>
            <div 
              onClick={() => setShowDescModal(true)} 
              style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", marginBottom: "12px", cursor: "pointer", width: "fit-content" }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ma-text-secondary, #666)" }}>Discrip</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--ma-text-secondary, #666)" }}>expand_more</span>
            </div>
            <p className="yt-watch-meta">
              @{watchArtist?.username || watchArtist?.display_name || "music-antenna"}
              {" · "}{activeMedia.views || 0} views
              {" · "}{new Date(activeMedia.created_at).toLocaleDateString()}
            </p>

            <div className="yt-watch-actions" style={{ marginBottom: "8px", paddingBottom: "8px" }}>
              <button className={`yt-watch-action ${isLiked ? "liked" : ""}`} onClick={(e) => { e.stopPropagation(); handleToggleLike(activeMedia.id); }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                  thumb_up
                </span>
                <span className="yt-watch-action-label">
                  {likesCount > 0 ? likesCount : "Like"}
                </span>
              </button>
              <button className="yt-watch-action" onClick={() => {
                  localStorage.setItem(`disliked_${activeMedia.id}`, "true");
                  setMessage("Video disliked.");
                  
                }}>
                <span className="material-symbols-outlined">thumb_down</span>
              </button>
              <button className="yt-watch-action" onClick={(e) => { e.stopPropagation(); handleShare(activeMedia); }}>
                <span className="material-symbols-outlined">share</span>
                <span className="yt-watch-action-label">Share</span>
              </button>
              
              {activeMedia.allow_download && (
                <a href={activeMedia.playbackUrl} download={activeMedia.title} target="_blank" rel="noopener noreferrer" className="yt-watch-action" style={{ textDecoration: "none", color: "var(--ma-text, #000)" }}>
                  <span className="material-symbols-outlined">download</span>
                  <span className="yt-watch-action-label">Download</span>
                </a>
              )}

              <button className="yt-watch-action" onClick={async (e) => { e.stopPropagation(); if (!session?.user?.id) { setMessage("Please sign in to save media."); return; } if (!activeMedia?.id) { setMessage("Select media before saving to a playlist."); return; } await fetchUserPlaylistsForModal(); setShowPlaylistModal(true); }}>
                <span className="material-symbols-outlined">playlist_add</span>
                <span className="yt-watch-action-label">Save</span>
              </button>
              
              <button className="yt-watch-action" onClick={(e) => { e.stopPropagation(); setShowMoreMenu(activeMedia); }}>
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            <div className="yt-watch-channel" style={{ padding: "8px 0", margin: "0px 0px 4px 0px" }}>
              {watchArtist?.avatar_url ? (
                <img className="yt-watch-avatar" src={watchArtist.avatar_url} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <div className="yt-watch-avatar yt-watch-avatar-fallback">
                  {(watchArtist?.display_name || "M").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="yt-watch-channel-info">
                <h3 className="yt-watch-channel-name"
                  onClick={() => {
                    if (watchArtist?.id) {
                      setActiveMedia(null);
                      setShowWatchPage(false);
                      openChannel(watchArtist.id);
                    }
                  }}>
                  {watchArtist?.display_name || "Unknown artist"}
                </h3>
                <p className="yt-watch-channel-sub">{subscriberCount} subscribers</p>
              </div>
              {activeMedia.artist_id === session?.user?.id ? (
                <button className="yt-watch-subscribe" onClick={() => { setActiveMedia(null); setShowWatchPage(false); openManagePage("channel"); }}>
                  Edit video
                </button>
              ) : (
                <button 
                  className={"yt-watch-subscribe" + (isSubscribed ? " subscribed" : "")}
                  onClick={() => handleToggleSubscribe(activeMedia.artist_id)}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>

            

            <div 
              onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); }}
              style={{ width: "100%", padding: "8px 10px", background: "var(--ma-surface, #f2f2f2)", borderRadius: "10px", color: "var(--ma-text, #000)", marginTop: "0px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer", border: "1px solid var(--ma-border, #e5e5e5)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>Comments <span style={{ color: "var(--ma-text-secondary, #666)" }}>{comments.length}</span></span>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>expand_more</span>
              </div>
              
              {comments.length > 0 && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", minWidth: 0 }}>
                  <div className="yt-video-avatar" style={{ width: "24px", height: "24px", flexShrink: 0 }}>
                    {comments[0].profiles?.avatar_url ? <img src={comments[0].profiles.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : "♫"}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--ma-text-secondary, #666)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                    {comments[0].content}
                  </p>
                </div>
              )}
            </div>

            
          </div>
        </section>
      )}

      {showAccountPage && (
        <section className="yt-you" style={{ padding: "0 0 120px", background: "var(--ma-bg, #fff)", minHeight: "100vh" }}>
          <style>{`button { min-height: 44px !important; min-width: 44px !important; }`}</style>
          
          {/* 1. BANNER */}
          <div style={{ width: "100%", height: "140px", background: "radial-gradient(circle at 50% -20%, #ff365f 0%, rgba(255, 54, 95, 0.6) 60%, var(--ma-bg, #fff) 100%)", position: "relative" }}>
            
          </div>

          {/* 2. PROFILE HEADER (Overlapping the banner) */}
          <style>{`
            
            
            .btn-pink { background-color: #ff365f !important; color: #ffffff !important; padding: 10px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 14px !important; border: none !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; width: 100% !important; }
            .btn-gray { background-color: var(--ma-surface, #f0f0f0) !important; color: var(--ma-text, #000) !important; padding: 10px !important; border-radius: 8px !important; font-weight: 500 !important; font-size: 14px !important; border: 1px solid var(--ma-border, #e5e5e5) !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; width: 100% !important; }
            .btn-circle { background-color: var(--ma-surface, #f0f0f0) !important; color: var(--ma-text, #000) !important; width: 44px !important; height: 44px !important; border-radius: 50% !important; border: 1px solid var(--ma-border, #e5e5e5) !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; }
          `}</style>

          <div style={{ padding: "0 16px", marginTop: "-44px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
              <div style={{ width: "88px", height: "88px", borderRadius: "50%", border: "4px solid var(--ma-bg, #fff)", background: "#ff365f", overflow: "hidden", flexShrink: 0 }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "32px", fontWeight: "bold", color: "var(--ma-text)", display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>{(profile?.display_name || displayUser || "M").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{ paddingBottom: "4px" }}>
                
<style>{`
  
  
`}</style>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "8px" }}>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px", color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                    {profile?.display_name || displayUser || "Music listener"}
                    {profile?.role === "artist" && media.filter(m => m.artist_id === session?.user?.id).length >= 10 && mySubCount >= 500 && (
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#1D9BF0", fontVariationSettings: "'FILL' 1" }} title="Verified Artist">verified</span>
                    )}
                  </h2>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "rgba(255, 255, 255, 0.85)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                    @{profile?.username || profile?.display_name || "music-antenna-user"}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: "500", color: "rgba(255, 255, 255, 0.7)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                    {profile?.bio || "Shadow Boss"}
                  </p>
                </div>
              </div>
            </div>

            

            {profile?.role === "artist" && (
              <p style={{ margin: "8px 0 16px", fontSize: "13px", color: "var(--ma-text-secondary, #666)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>artist</span> Artist
              </p>
            )}

            {/* 3. STATS ROW */}
            <div style={{ display: profile?.role === "artist" ? "flex" : "none", justifyContent: "space-around", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--ma-border, #e5e5e5)", marginBottom: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{media.filter(m => m.artist_id === session?.user?.id).length}</div>
                <div style={{ fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>Uploads</div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "var(--ma-border, #e5e5e5)" }}></div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{media.filter(m => m.artist_id === session?.user?.id).reduce((sum, m) => sum + (m.views || 0), 0)}</div>
                <div style={{ fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>Views</div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "var(--ma-border, #e5e5e5)" }}></div>
              <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => { if (session?.user?.id) { supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", session.user.id).then(({ count }) => setMySubCount(count || 0)); setMessage("Refreshed subscriber count!"); } }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{mySubCount}</div>
                <div style={{ fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>Subscribers</div>
              </div>
            </div>

            {/* 4. ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              {profile?.role === "artist" && (
                <div style={{ flex: 1, display: "flex" }}>
                  <button className="btn-pink" onClick={() => { setShowAccountPage(false); openChannel(session?.user?.id); }}>
                    View channel
                  </button>
                </div>
              )}
              
              <button className="btn-circle" aria-label="Share Profile" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareProfile(); }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>share</span>
              </button>
            </div>


            
            {/* 5. TABS */}
            <div style={{ display: profile?.role === "artist" ? "flex" : "none", gap: "24px", borderBottom: "1px solid var(--ma-border, #e5e5e5)", marginBottom: "16px" }}>
              <button onClick={() => setProfileTab("overview")} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: profileTab === "overview" ? "#ff365f" : "var(--ma-text-secondary, #666)", fontWeight: profileTab === "overview" ? "600" : "500", fontSize: "14px", borderBottom: profileTab === "overview" ? "2px solid #ff365f" : "none", cursor: "pointer" }}>Overview</button>
              <button onClick={() => setProfileTab("contents")} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: profileTab === "contents" ? "#ff365f" : "var(--ma-text-secondary, #666)", fontWeight: profileTab === "contents" ? "600" : "500", fontSize: "14px", borderBottom: profileTab === "contents" ? "2px solid #ff365f" : "none", cursor: "pointer" }}>Contents</button>
              <button onClick={openAnalytics} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: "var(--ma-text-secondary, #666)", fontWeight: "500", fontSize: "14px", cursor: "pointer" }}>Analytics</button>
              <button onClick={() => setProfileTab("about")} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: profileTab === "about" ? "#ff365f" : "var(--ma-text-secondary, #666)", fontWeight: profileTab === "about" ? "600" : "500", fontSize: "14px", borderBottom: profileTab === "about" ? "2px solid #ff365f" : "none", cursor: "pointer" }}>About</button>
            </div>

            {profileTab === "overview" && (<>
            {/* 6. CREATOR DASHBOARD CARD */}
            {profile?.role === "artist" && (
              <div style={{ background: "var(--ma-surface, #f0f0f0)", borderRadius: "12px", padding: "16px", border: "1px solid var(--ma-border, #e5e5e5)", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--ma-text, #000)" }}>Creator dashboard</h3>
                  <span className="material-symbols-outlined" onClick={openAnalytics} style={{ color: "#ff365f", fontSize: "20px", cursor: "pointer" }}>bar_chart</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ background: "var(--ma-bg, #fff)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", background: "rgba(255,54,95,0.1)", padding: "6px", borderRadius: "50%", fontSize: "18px", marginBottom: "8px", display: "inline-block" }}>upload</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{media.filter(m => m.artist_id === session?.user?.id).length}</div>
                    <div style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)" }}>Uploads</div>
                  </div>
                  <div style={{ background: "var(--ma-bg, #fff)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", background: "rgba(255,54,95,0.1)", padding: "6px", borderRadius: "50%", fontSize: "18px", marginBottom: "8px", display: "inline-block" }}>visibility</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{media.filter(m => m.artist_id === session?.user?.id).reduce((sum, m) => sum + (m.views || 0), 0)}</div>
                    <div style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)" }}>Views</div>
                  </div>
                  <div style={{ background: "var(--ma-bg, #fff)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", background: "rgba(255,54,95,0.1)", padding: "6px", borderRadius: "50%", fontSize: "18px", marginBottom: "8px", display: "inline-block" }}>group</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{mySubCount}</div>
                    <div style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)" }}>Subscribers</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <button onClick={() => { setShowAccountPage(false); setShowUpload(true); }} style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>upload</span> Upload
                  </button>
                  <button onClick={() => { setShowAccountPage(false); openManagePage("channel"); }} style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>format_list_bulleted</span> Manage
                  </button>
                  <button onClick={openAnalytics} style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>bar_chart</span> Analytics
                  </button>
                </div>
              </div>
            )}
            
            {/* HISTORY */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--ma-text, #000)" }}>History</h3>
  <button
    onClick={async () => {
      setShowAccountPage(false);
      setShowAllPlaylists(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      await fetchPlaylists();
    }}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "6px", padding: "8px 12px", flexShrink: 0,
      background: "var(--ma-surface, #f0f0f0)",
      color: "var(--ma-text, #111)",
      border: "1px solid var(--ma-border, #e5e5e5)",
      borderRadius: "10px", cursor: "pointer", fontSize: "13px",
      fontWeight: "600"
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: "19px", color: "#ff365f" }}>queue_music</span>
    Playlists
  </button>
</div>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px", marginBottom: "16px" }}>
               {history.slice(0, 4).map((item) => (
                  <div key={item.id} onClick={() => { const found = media.find(m => m.id === item.id); if (found) openPlayer(found); }} style={{ flexShrink: 0, width: "140px", cursor: "pointer" }}>
                    <div style={{ width: "140px", height: "80px", background: "var(--ma-surface)", borderRadius: "8px", overflow: "hidden", marginBottom: "6px" }}>
                      {item.thumbnailUrl ? <img loading="lazy" src={item.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ma-text-secondary, #666)" }}><span className="material-symbols-outlined">movie</span></div>}
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--ma-text, #000)", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                  </div>
                ))}
            </div>

            </>
            )}

            {profileTab === "contents" && (
              <div style={{ padding: "0 0 20px 0" }}>
                {media.filter(m => m.artist_id === session?.user?.id).length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--ma-text-secondary)", marginTop: "40px" }}>No content uploaded yet.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
                    {media.filter(m => m.artist_id === session?.user?.id).map(item => (
                      <div key={item.id} onClick={() => openPlayer(item)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "10px", overflow: "hidden", background: "var(--ma-surface)", position: "relative" }}>
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ma-text-secondary)", fontSize: "24px" }}>♫</div>
                          )}
                          <span style={{ position: "absolute", bottom: "4px", right: "4px", background: "rgba(0,0,0,0.7)", color: "var(--ma-text)", fontSize: "9px", fontWeight: "bold", padding: "2px 4px", borderRadius: "4px", backdropFilter: "blur(4px)" }}>
                            {item.media_type === "video" ? (item.is_short ? "SHORT" : "VIDEO") : "AUDIO"}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--ma-text, #000)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--ma-text-secondary, #666)" }}>
                          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileTab === "about" && (
              <div style={{ background: "var(--ma-surface, #f0f0f0)", borderRadius: "16px", border: "1px solid var(--ma-border, #e5e5e5)", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <span className="material-symbols-outlined" style={{ color: "#ff365f", fontSize: "22px" }}>info</span>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--ma-text, #000)" }}>Channel Details</h3>
                </div>

                {/* Bio Section */}
                <div style={{ marginBottom: "24px", padding: "16px", background: "var(--ma-bg, #fff)", borderRadius: "12px", borderLeft: "4px solid #ff365f" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--ma-text-secondary, #666)", lineHeight: "1.6", fontStyle: "italic" }}>
                    "{profile?.bio || "This artist hasn't added a bio yet."}"
                  </p>
                </div>

                {/* Premium Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  
                  {/* Joined Date */}
                  <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>calendar_month</span>
                    <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Joined</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>
                      {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Subscribers */}
                  <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>group</span>
                    <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Subscribers</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{mySubCount}</span>
                  </div>

                  {/* Total Uploads */}
                  <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>upload</span>
                    <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Uploads</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>
                      {media.filter(m => m.artist_id === session?.user?.id).length}
                    </span>
                  </div>

                  {/* Total Views */}
                  <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>visibility</span>
                    <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Total Views</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>
                      {media.filter(m => m.artist_id === session?.user?.id).reduce((sum, m) => sum + (m.views || 0), 0)}
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* EDIT PROFILE FORM */}

            {showProfileEditor && (
              <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "var(--ma-bg, #fff)", zIndex: 999999, display: "flex", flexDirection: "column", overflowY: "auto" }}>
                
                {/* Top Header */}
                <div style={{ display: "flex", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--ma-border, #e5e5e5)", background: "var(--ma-bg, #fff)", position: "sticky", top: 0, zIndex: 10 }}>
                  <button type="button" onClick={() => setShowProfileEditor(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text, #000)", cursor: "pointer", display: "flex", padding: "8px", marginRight: "8px" }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "var(--ma-text, #000)", fontWeight: "700" }}>Edit Profile</h2>
                </div>

                {/* Form Container */}
                <form onSubmit={handleSaveProfile} style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", flex: 1 }}>
                  
                  {/* Avatar Upload */}
                  <div style={{ position: "relative", width: "120px", height: "120px" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--ma-surface, #f0f0f0)", overflow: "hidden", border: "3px solid var(--ma-bg, #fff)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                      {profilePhotoFile ? (
                        <img src={URL.createObjectURL(profilePhotoFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: "36px", color: "var(--ma-text, #000)", fontWeight: "bold" }}>{displayUser.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <label style={{ position: "absolute", bottom: "0", right: "0", background: "#ff365f", color: "var(--ma-text)", width: "40px", height: "40px", borderRadius: "50%", display: "grid", placeItems: "center", cursor: "pointer", border: "3px solid var(--ma-bg, #fff)", boxShadow: "0 4px 12px rgba(255,54,95,0.4)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>photo_camera</span>
                      <input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files[0])} style={{ display: "none" }} />
                    </label>
                  </div>

                  {/* Inputs */}
                  <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--ma-text-secondary, #666)", marginBottom: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Display Name</label>
                      <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your Name" style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", outline: "none", fontSize: "15px", display: "block" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--ma-text-secondary, #666)", marginBottom: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bio</label>
                      <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Tell people about yourself..." rows="4" style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", border: "1px solid var(--ma-border, #e5e5e5)", outline: "none", fontSize: "15px", resize: "none", display: "block" }} />
                    </div>
                    
                    {/* Action Buttons (Failsafe Wrappers) */}
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* SAVE BUTTON WRAPPER */}
                      <div style={{ width: "100%", backgroundColor: "#ff365f", borderRadius: "14px", boxShadow: "0 8px 24px rgba(255, 54, 95, 0.3)", display: "block" }}>
                        <button type="submit" disabled={profileSaving} style={{ width: "100%", padding: "16px", backgroundColor: "transparent", color: "#ffffff", border: "none", fontWeight: "700", fontSize: "16px", cursor: profileSaving ? "not-allowed" : "pointer", display: "block" }}>
                          {profileSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>

                      {/* CANCEL BUTTON WRAPPER */}
                      <div style={{ width: "100%", border: "1px solid var(--ma-border, #e5e5e5)", borderRadius: "14px", display: "block" }}>
                        <button type="button" onClick={() => setShowProfileEditor(false)} style={{ width: "100%", padding: "16px", backgroundColor: "transparent", color: "var(--ma-text, #000)", border: "none", fontWeight: "600", fontSize: "15px", cursor: "pointer", display: "block" }}>
                          Cancel
                        </button>
                      </div>

                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

            {showChannelPage && (
        <section className="yt-channel">

          <style>{`/* CHANNEL_PAGE_THEME_FIX */
            /* Main Container */
            section.yt-channel {
              background-color: var(--ma-bg, #fff) !important;
              color: var(--ma-text, #000) !important;
            }

            /* Top Bar */
            .yt-channel-topbar {
              background-color: var(--ma-bg, #fff) !important;
              border-bottom: 1px solid var(--ma-border, #e5e5e5) !important;
              color: var(--ma-text, #000) !important;
            }

            /* Meta Text */
            .yt-channel-meta h1 {
              color: var(--ma-text, #000) !important;
            }
            .yt-channel-sub, 
            .yt-channel-subscribers, 
            .yt-channel-bio {
              color: var(--ma-text-secondary, #666) !important;
            }

            /* Action Buttons (Edit channel / Analytics) */
            .yt-channel-actions button {
              background-color: var(--ma-surface, #f2f2f2) !important;
              color: var(--ma-text, #000) !important;
              border: 1px solid var(--ma-border, #e5e5e5) !important;
            }

            /* Tabs */
            .yt-channel-tabs {
              border-bottom: 1px solid var(--ma-border, #e5e5e5) !important;
            }
            .yt-channel-tab {
              color: var(--ma-text-secondary, #666) !important;
              background: transparent !important;
            }
            .yt-channel-tab-active {
              color: #ff365f !important;
              border-bottom: 2px solid #ff365f !important;
              font-weight: 600 !important;
            }
          `}</style>

          <div className="yt-channel-topbar">
            <button
              className="yt-icon-btn"
              aria-label="Back"
              onClick={() => {
                setShowChannelPage(false);
                if (channelProfile?.id === session?.user?.id) {
                  setShowAccountPage(true);
                }
                setChannelProfile(null);
                setChannelMedia([]);
              }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="yt-channel-topbar-right">
              <button className="yt-icon-btn" aria-label="Search"
                onClick={() => { setShowChannelPage(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="yt-icon-btn" aria-label="More">
                <span className="material-symbols-outlined" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setShowMoreMenu(activeMedia); }}>more_vert</span>
              </button>
            </div>
          </div>

          {channelLoading ? (
            <div className="yt-you-empty">Loading channel…</div>
          ) : channelProfile ? (
            <>
              <div className="yt-channel-banner">
                {channelProfile.cover_url ? (
                  <img src={channelProfile.cover_url} alt="" />
                ) : (
                  <div className="yt-channel-banner-placeholder" />
                )}
              </div>

              <div className="yt-channel-head">
                <div className="yt-channel-avatar-wrap">
                  {channelProfile.avatar_url ? (
                    <img
                      className="yt-channel-avatar-img"
                      src={channelProfile.avatar_url}
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : null}
                  <div className="yt-channel-avatar-fallback">
                    {(channelProfile.display_name || "M").charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="yt-channel-meta">
                  <h1>{channelProfile.display_name || "Unknown artist"}</h1>
                  <p className="yt-channel-sub">
                    @{channelProfile.username || channelProfile.display_name || "music-antenna"} · {channelMedia.length} {channelMedia.length === 1 ? "upload" : "uploads"}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", width: "100%" }}>
                    <p className="yt-channel-subscribers" style={{ margin: 0, fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>{subscriberCount} subscribers</p>
                    {channelProfile.bio && (
                      <p className="yt-channel-bio" style={{ margin: "4px 0 0 0", fontSize: "11px", lineHeight: "1.4", color: "var(--ma-text-secondary, #666)", textAlign: "left", maxWidth: "100%", wordBreak: "break-word" }}>
                        {channelProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="yt-channel-actions">
                {channelProfile.id === session?.user?.id ? (
                  <>
                    <button
                      type="button"
                      className="yt-you-btn yt-you-btn-secondary"
                      onClick={() => {
                        setShowChannelPage(false);
                        setShowAccountPage(true);
                        setProfileName(profile?.username || profile?.display_name || "");
                        setProfileBio(profile?.bio || "");
                        setProfilePhotoFile(null);
                        setCoverPhotoFile(null);
                        setShowProfileEditor(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}>edit</span>
                      Edit channel
                    </button>
                    <button
                      type="button"
                      className="yt-you-btn yt-you-btn-secondary"
                      onClick={openAnalytics}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}>bar_chart</span>
                      Analytics
                    </button>
                  </>
                ) : (
                  <>
                    {channelProfile.id === session?.user?.id ? (
                      <button
                        type="button"
                        className="yt-you-btn yt-you-btn-primary"
                        onClick={() => setMessage("Customize channel coming soon.")}
                      >
                        Customize channel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={"yt-you-btn " + (isSubscribed ? "yt-you-btn-secondary" : "yt-you-btn-primary")}
                        onClick={() => handleToggleSubscribe(channelProfile.id)}
                      >
                        {isSubscribed ? "Subscribed" : "Subscribe"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="yt-you-btn yt-you-btn-secondary"
                      onClick={() => setMessage("Join coming soon.")}
                    >
                      Join
                    </button>
                  </>
                )}
              </div>

              <div className="yt-channel-tabs">
                {[
                  "Home", 
                  "Videos", 
                  "Shorts", 
                  "Playlists", 
                  ...(channelProfile?.id === session?.user?.id ? ["Manage"] : []), 
                  "About"
                ].map((t) => (
                  <button
                    key={t}
                    className={"yt-channel-tab" + (channelTab === t ? " yt-channel-tab-active" : "")}
                    onClick={() => {
                      if (t === "Manage") {
                        openManagePage("channel");
                      } else {
                        setChannelTab(t);
                      }
                    }}
                    style={t === "Manage" ? { color: "var(--ma-accent)", fontWeight: "bold" } : {}}
                  >
                    {t}
                  </button>
                ))}
              </div>

              
            {channelTab === "Playlists" && (
              <div style={{ padding: "0 16px 20px 16px" }}>
                
                {/* Create Playlist Button (Only visible to owner) */}
                {channelProfile?.id === session?.user?.id && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--ma-text)" }}>Channel Playlists</h3>
                    <button onClick={() => setShowCreatePlaylistModal(true)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", padding: "8px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span> Create
                    </button>
                  </div>
                )}

                {channelPlaylists.length === 0 ? (
                  <p className="yt-you-empty" style={{ textAlign: "center", marginTop: "20px", color: "var(--ma-text-secondary)" }}>No playlists found on this channel.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {channelPlaylists.map(playlist => {
                      // Find the first item with a thumbnail to use as cover
                      const firstItemWithThumb = playlist.playlist_items?.find(item => item.media?.thumbnail_path);
                      const coverUrl = firstItemWithThumb 
                        ? supabase.storage.from(BUCKET).getPublicUrl(firstItemWithThumb.media.thumbnail_path).data.publicUrl 
                        : null;

                      return (
                        <div key={playlist.id} onClick={() => openPlaylist(playlist)} style={{ cursor: "pointer", background: "var(--ma-surface)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--ma-border)", display: "flex", flexDirection: "column" }}>
                          {/* Cover Image */}
                          <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--ma-bg)", position: "relative" }}>
                            {coverUrl ? (
                              <img src={coverUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : null}
                            {/* Fallback Icon (Always rendered underneath, image covers it) */}
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ma-text-secondary)", position: "absolute", top: 0, left: 0, zIndex: -1 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>playlist_play</span>
                            </div>
                            
                            <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.8)", color: "var(--ma-text)", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px", backdropFilter: "blur(4px)" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>playlist_play</span>
                              {playlist.playlist_items?.length || 0}
                            </div>
                          </div>
                          
                          {/* Playlist Info */}
                          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--ma-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{playlist.title}</h4>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <p style={{ margin: 0, fontSize: "11px", color: "var(--ma-text-secondary)" }}>{channelProfile?.display_name || "Creator"}</p>
                              {channelProfile?.id === session?.user?.id && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist.id); }} style={{ background: "transparent", border: 0, color: "#FF4E45", cursor: "pointer", padding: "4px" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {channelTab === "About" ? (
                <div style={{ background: "var(--ma-surface, #f0f0f0)", borderRadius: "16px", border: "1px solid var(--ma-border, #e5e5e5)", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", fontSize: "22px" }}>info</span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--ma-text, #000)" }}>Channel Details</h3>
                  </div>

                  {/* Bio Section */}
                  <div style={{ marginBottom: "24px", padding: "16px", background: "var(--ma-bg, #fff)", borderRadius: "12px", borderLeft: "4px solid #ff365f" }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--ma-text-secondary, #666)", lineHeight: "1.6", fontStyle: "italic" }}>
                      "{channelProfile?.bio || "This artist hasn't added a bio yet."}"
                    </p>
                  </div>

                  {/* Premium Stats Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    
                    {/* Joined Date */}
                    <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>calendar_month</span>
                      <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Joined</span>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>
                        {new Date(channelProfile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Subscribers */}
                    <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>group</span>
                      <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Subscribers</span>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>{subscriberCount}</span>
                    </div>

                    {/* Total Uploads */}
                    <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>upload</span>
                      <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Uploads</span>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>
                        {channelMedia.length}
                      </span>
                    </div>

                    {/* Total Views */}
                    <div style={{ background: "var(--ma-bg, #fff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary, #888)" }}>visibility</span>
                      <span style={{ fontSize: "11px", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>Total Views</span>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--ma-text, #000)" }}>
                        {channelMedia.reduce((sum, item) => sum + (item.views || 0), 0)}
                      </span>
                    </div>

                  </div>
                </div>
              ) : (() => {
                let filtered = channelMedia;
                if (channelTab === "Videos") filtered = channelMedia.filter(i => i.media_type === "video" && !i.is_short);
                else if (channelTab === "Shorts") filtered = channelMedia.filter(i => i.is_short);
                

                if (filtered.length === 0) {
                  return <p className="yt-you-empty">No {channelTab.toLowerCase()} found on this channel.</p>;
                }

                return (
                  <div className="ma-media-grid">
                    {filtered.map((item) => (
                    <article className="yt-video" key={item.id}>
                      <button
                        className="yt-thumb"
                        onClick={() => openPlayer(item)}
                        aria-label={"Play " + item.title}
                      >
                        {item.thumbnailUrl ? (
                          <img loading="lazy" src={item.thumbnailUrl} alt="" loading="lazy" />
                        ) : (
                          <div className="yt-thumb-fallback">
                            <span>{item.media_type === "video" ? "▶" : "♫"}</span>
                          </div>
                        )}
                        <span className="yt-duration">
                          {item.media_type === "video" ? "VIDEO" : "AUDIO"}
                        </span>
                      </button>
                      <div className="yt-video-row">
                        <div className="yt-video-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#ff365f", display: "grid", placeItems: "center", color: "var(--ma-text)", fontSize: "14px" }}>
                          {item.profiles?.avatar_url || channelProfile?.avatar_url ? (
                            <img loading="lazy" src={item.profiles?.avatar_url || channelProfile?.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            "♫"
                          )}
                        </div>
                        <div className="yt-video-info">
                          <h3 className="yt-video-title">{item.title}</h3>
                          <p className="yt-video-meta">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                );
              })()}
            </>
          ) : (
            <p className="yt-you-empty">Channel not found.</p>
          )}
        </section>
      )}

      {showBecomeArtistForm && (
        <section className="yt-become-page">
          <div className="yt-become-topbar">
            <button className="yt-icon-btn" aria-label="Back"
              onClick={() => setShowBecomeArtistForm(false)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="yt-become-heading">Become an Artist</h2>
            <div className="yt-become-topbar-right" />
          </div>

          <p className="yt-become-intro">
            Tell us about yourself. This upgrades your current account into an
            artist profile — you keep the same login and history.
          </p>

          <form className="yt-become-form" onSubmit={submitBecomeArtist}>
            <label className="yt-upload-field">
              <span>Artist name <b>*</b></span>
              <input
                value={baName}
                onChange={(e) => setBaName(e.target.value)}
                maxLength={80}
                placeholder="The name your audience will see"
                required
              />
            </label>

            <label className="yt-upload-field">
              <span>About / Bio</span>
              <textarea
                value={baBio}
                onChange={(e) => setBaBio(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="What do you create? Who is your audience?"
              />
            </label>

            <label className="yt-upload-field">
              <span>Category</span>
              <select
                value={baCategory}
                onChange={(e) => setBaCategory(e.target.value)}
              >
                <option>Music</option>
                <option>DJ</option>
                <option>Gospel</option>
                <option>Comedy</option>
                <option>Interview</option>
                <option>Podcast</option>
                <option>News</option>
                <option>Sports</option>
                <option>Other</option>
              </select>
            </label>

            <div className="yt-upload-field">
              <span>Profile picture (optional)</span>
              <label className="yt-upload-thumb">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setBaPhoto(e.target.files?.[0] || null)}
                />
                <span className="material-symbols-outlined">account_circle</span>
                <span className="yt-upload-thumb-text">
                  {baPhoto ? baPhoto.name : (profile?.avatar_url ? "Keep current picture" : "Upload a picture")}
                </span>
              </label>
            </div>

            <div className="yt-upload-field">
              <span>Cover photo (optional)</span>
              <label className="yt-upload-thumb">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setBaCover(e.target.files?.[0] || null)}
                />
                <span className="material-symbols-outlined">wallpaper</span>
                <span className="yt-upload-thumb-text">
                  {baCover ? baCover.name : (profile?.cover_url ? "Keep current cover" : "Upload a cover photo")}
                </span>
              </label>
            </div>

            <div className="yt-become-note">
              <span className="material-symbols-outlined">info</span>
              <span>
                Your account upgrades in place. No new login, no duplicate
                profile — same history, now with upload rights.
              </span>
            </div>

            <div className="yt-upload-actions">
              <button
                type="button"
                className="yt-upload-cancel"
                onClick={() => setShowBecomeArtistForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="yt-upload-submit"
                disabled={baBusy}
              >
                {baBusy ? "Activating..." : "Activate artist profile"}
              </button>
            </div>
          </form>
        </section>
      )}

      {showAnalytics && (
        <section style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: "56px", background: "var(--ma-bg, #fff)", zIndex: 9999, overflowY: "auto", padding: "16px", color: "var(--ma-text, #000)", fontFamily: "Roboto, sans-serif" }}>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid var(--ma-border, #e5e5e5)", paddingBottom: "16px" }}>
            <button onClick={() => { setShowAnalytics(false); setShowAccountPage(true); }} style={{ background: "var(--ma-surface)", border: "1px solid var(--ma-border)", borderRadius: "50%", width: "36px", height: "36px", color: "var(--ma-text)", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
            </button>
            <h2 style={{ margin: "0 0 0 16px", fontSize: "20px", fontWeight: "700", color: "var(--ma-text)" }}>Channel Analytics</h2>
          </div>

          {analyticsLoading ? (
            <p style={{ textAlign: "center", marginTop: "40px", color: "var(--ma-text-secondary, #666)" }}>Loading data...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Overview Card */}
              <div style={{ background: "var(--ma-surface)", padding: "24px 16px", borderRadius: "16px", border: "1px solid var(--ma-border)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "var(--ma-text)", textAlign: "center" }}>Overview</h3>
                <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(62, 166, 255, 0.1)", display: "grid", placeItems: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#3EA6FF", fontSize: "20px" }}>visibility</span>
                    </div>
                    <h2 style={{ margin: 0, color: "var(--ma-text)", fontSize: "22px", fontWeight: "800" }}>{analyticsData.totalViews}</h2>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)" }}>Views</p>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255, 54, 95, 0.1)", display: "grid", placeItems: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#ff365f", fontSize: "20px" }}>group</span>
                    </div>
                    <h2 style={{ margin: 0, color: "var(--ma-text)", fontSize: "22px", fontWeight: "800" }}>{analyticsData.totalSubs}</h2>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)" }}>Subscribers</p>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(43, 166, 64, 0.1)", display: "grid", placeItems: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#2BA640", fontSize: "20px" }}>comment</span>
                    </div>
                    <h2 style={{ margin: 0, color: "var(--ma-text)", fontSize: "22px", fontWeight: "800" }}>{analyticsData.totalComments}</h2>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)" }}>Comments</p>
                  </div>
                </div>
              </div>

              {/* Weekly Card */}
              <div style={{ background: "var(--ma-surface)", padding: "24px 16px", borderRadius: "16px", border: "1px solid var(--ma-border)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "var(--ma-text)", textAlign: "center" }}>Last 7 Days</h3>
                <div style={{ display: profile?.role === "artist" ? "flex" : "none", justifyContent: "space-around", textAlign: "center" }}>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(62, 166, 255, 0.1)", display: "grid", placeItems: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#3EA6FF", fontSize: "20px" }}>trending_up</span>
                    </div>
                    <h2 style={{ margin: 0, color: "#3EA6FF", fontSize: "22px", fontWeight: "800" }}>+{analyticsData.weeklyViews}</h2>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)" }}>New Views</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255, 54, 95, 0.1)", display: "grid", placeItems: "center" }}>
                      <span className="material-symbols-outlined" style={{ color: "#ff365f", fontSize: "20px" }}>person_add</span>
                    </div>
                    <h2 style={{ margin: 0, color: "#ff365f", fontSize: "22px", fontWeight: "800" }}>+{analyticsData.weeklySubs}</h2>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)" }}>New Subs</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>
      )}

      {showManagePage && (
        <section className="yt-manage-page">
          <div className="yt-manage-topbar">
            <button className="yt-icon-btn" onClick={() => { 
              if (editingMedia) {
                setEditingMedia(null); 
              } else {
                  setShowManagePage(false);
                  if (manageSource === "channel") {
                    setShowChannelPage(true);
                  } else {
                    setShowAccountPage(true);
                  }
                }
            }}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "700" }}>{editingMedia ? "Edit Video" : "Manage Content"}</h2>
            <div style={{ width: "40px" }}></div>
          </div>

          {editingMedia ? (
            <form className="ma-edit-form" onSubmit={handleUpdateVideo}>
              <h3 style={{ marginBottom: "20px", color: "var(--ma-text-primary)" }}>Edit Details</h3>

              <label className="ma-edit-label">
                <span>Title</span>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="ma-edit-input" />
              </label>

              <label className="ma-edit-label">
                <span>Description</span>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} className="ma-edit-input" />
              </label>

              <div className="ma-edit-label">
                <span>Thumbnail</span>
                <label className="ma-edit-file">
                  <input type="file" accept="image/*" onChange={e => setEditThumbnailFile(e.target.files?.[0] || null)} />
                  <span className="material-symbols-outlined">image</span>
                  <span>{editThumbnailFile ? editThumbnailFile.name : "Upload new thumbnail"}</span>
                </label>
              </div>

              <label className="ma-edit-label">
                <span>Visibility</span>
                <select value={editVisibility} onChange={e => setEditVisibility(e.target.value)} className="ma-edit-input">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </label>

              <label className="ma-checkbox" style={{ marginBottom: "24px" }}>
                <input type="checkbox" checked={editAllowDownload} onChange={e => setEditAllowDownload(e.target.checked)} />
                Allow downloads
              </label>

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="ma-btn-cancel" onClick={() => setEditingMedia(null)}>Cancel</button>
                <button type="submit" className="ma-btn-primary" disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="ma-manage-controls">
                <div className="ma-search-box">
                  <span className="material-symbols-outlined">search</span>
                  <input 
                    type="text" 
                    placeholder="Search your uploads..." 
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                  />
                </div>
                <button className="ma-btn-primary" onClick={() => { setShowManagePage(false); setShowUpload(true); }} style={{ width: "auto", padding: "10px 16px", whiteSpace: "nowrap" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span> Upload
                </button>
              </div>

              <div className="yt-manage-list">
                {manageLoading ? (
                  <p style={{ padding: "20px", color: "var(--ma-text-secondary)", textAlign: "center" }}>Loading uploads...</p>
                ) : manageMedia.length === 0 ? (
                  <div className="ma-empty-state">
                    <span className="material-symbols-outlined">video_library</span>
                    <h3>No uploads yet</h3>
                    <p>Your published tracks and videos will appear here.</p>
                  </div>
                ) : (
                  manageMedia
                    .filter(item => item.title.toLowerCase().includes(manageSearch.toLowerCase()))
                    .map(item => (
                    <div key={item.id} className="ma-manage-card">
                      <div className="ma-manage-top-row">
                        <div className="ma-manage-thumb">
                          {item.thumbnail_path ? (
                            <img src={supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path).data.publicUrl} alt="" />
                          ) : (
                            <div className="ma-manage-thumb-fallback">
                              <span className="material-symbols-outlined">movie</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="ma-manage-info">
                          <h4>{item.title}</h4>
                          <div className="ma-manage-meta">
                            <span>{item.views || 0} views</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="ma-manage-badges">
                            <span className={`ma-badge ${item.visibility || 'public'}`}>{item.visibility || 'Public'}</span>
                            <span className={`ma-badge ${item.media_type}`}>{item.media_type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ma-manage-bottom-row">
                        <button className="ma-action-btn play" onClick={() => { setShowManagePage(false); openPlayer(item); }} title="Play">
                          <span className="material-symbols-outlined">play_arrow</span> Play
                        </button>
                        <button className="ma-action-btn edit" onClick={() => startEditingVideo(item)} title="Edit">
                          <span className="material-symbols-outlined">edit</span> Edit
                        </button>
                        <button className="ma-action-btn delete" onClick={() => { if(window.confirm("Delete this upload permanently?")) handleDeleteVideo(item.id, item.storage_path, item.thumbnail_path); }} title="Delete">
                          <span className="material-symbols-outlined">delete</span> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      )}

      {activeMedia && !showWatchPage && (
        <div 
          className={"yt-mini-player" + (navVisible || isDragging || miniPlayerPos ? "" : " yt-mini-hidden") + ((!isPlaying || !isScrolling) && !isDragging ? " is-hidden" : "") + (isDragging ? " yt-mini-dragging" : "")}
          style={{
            bottom: miniPlayerPos ? 'auto' : '72px',
            left: miniPlayerPos ? `${miniPlayerPos.left}px` : '16px',
            top: miniPlayerPos ? `${miniPlayerPos.top}px` : 'auto',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          
          <div className="yt-mini-cover" onClick={() => setShowWatchPage(true)}>
            {activeMedia.thumbnailUrl ? (
              <img loading="lazy" src={activeMedia.thumbnailUrl} alt="" style={{ pointerEvents: "none" }} />
            ) : (
              <div className="yt-mini-cover-fallback">♫</div>
            )}
          </div>

          <div className="yt-mini-controls">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const mediaEl = activeMedia.media_type === "audio" ? audioRef.current : videoRef.current;
                if (mediaEl) {
                  if (mediaEl.paused) mediaEl.play();
                  else mediaEl.pause();
                }
              }} 
              className="yt-mini-play-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1", pointerEvents: "none" }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            
            
          </div>

        </div>
      )}

    
      
      
      
      
      {showSubscriptionsPage && (
        <section style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--ma-bg-primary)", overflowY: "auto", paddingBottom: "80px", color: "var(--ma-text-primary)", fontFamily: "Roboto, sans-serif" }}>
          
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: "var(--ma-bg-primary)", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid var(--ma-border)" }}>
            <button onClick={() => setShowSubscriptionsPage(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text)", cursor: "pointer", display: "flex", padding: "8px", marginRight: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>arrow_back</span>
            </button>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--ma-text-primary)", flex: 1, textAlign: "center" }}>Subscriptions</h2>
            <button onClick={() => setSubsRefreshTrigger(prev => prev + 1)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary)", cursor: "pointer", display: "flex", padding: "8px" }}>
              <span className="material-symbols-outlined" style={{ opacity: subsPageLoading ? 0.5 : 1, fontSize: "24px" }}>refresh</span>
            </button>
          </div>

          {/* TABS */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--ma-border)", padding: "0 16px" }}>
            <button onClick={() => setSubsPageTab('subbers')} style={{ flex: 1, padding: "16px 0", background: "transparent", border: "none", borderBottom: subsPageTab === 'subbers' ? "2px solid #FF0033" : "2px solid transparent", color: subsPageTab === 'subbers' ? "var(--ma-text-primary)" : "var(--ma-text-secondary)", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }}>
              Subscribers ({subbersList.length})
            </button>
            <button onClick={() => setSubsPageTab('subs')} style={{ flex: 1, padding: "16px 0", background: "transparent", border: "none", borderBottom: subsPageTab === 'subs' ? "2px solid #FF0033" : "2px solid transparent", color: subsPageTab === 'subs' ? "var(--ma-text-primary)" : "var(--ma-text-secondary)", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }}>
              Following ({subsList.length})
            </button>
          </div>

          {/* TOOLBAR */}
          <div style={{ display: "flex", gap: "8px", padding: "16px", alignItems: "center", width: "100%", boxSizing: "border-box" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", background: "var(--ma-bg-secondary)", border: "1px solid var(--ma-border)", borderRadius: "12px", padding: "0 12px", height: "44px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)", fontSize: "20px", marginRight: "8px" }}>search</span>
              <input 
                type="text" 
                placeholder="Search..." 
                value={subsSearch}
                onChange={(e) => setSubsSearch(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", color: "var(--ma-text-primary)", outline: "none", fontSize: "14px" }}
              />
            </div>
            <select 
              value={subsSort} 
              onChange={(e) => setSubsSort(e.target.value)}
              style={{ flexShrink: 0, height: "44px", padding: "0 12px", borderRadius: "12px", background: "var(--ma-bg-secondary)", border: "1px solid var(--ma-border)", color: "var(--ma-text-primary)", outline: "none", fontSize: "14px", appearance: "none" }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A-Z</option>
            </select>
          </div>

          {/* CONTENT */}
          <div style={{ padding: "0 16px", maxWidth: "800px", margin: "0 auto" }}>
            {subsPageLoading ? (
              <div style={{ textAlign: "center", marginTop: "40px", color: "var(--ma-text-secondary)" }}>Loading...</div>
            ) : subsPageError ? (
              <div style={{ textAlign: "center", marginTop: "40px", color: "#FF0033" }}>{subsPageError}</div>
            ) : (
              (() => {
                const currentList = subsPageTab === 'subbers' ? subbersList : subsList;
                
                const filtered = currentList.filter(item => {
                  const p = item.profile;
                  if (!p) return false;
                  const term = subsSearch.toLowerCase();
                  return (p.username || "").toLowerCase().includes(term) || (p.display_name || "").toLowerCase().includes(term);
                });
                
                const sorted = filtered.sort((a, b) => {
                  if (subsSort === "newest") return new Date(b.created_at) - new Date(a.created_at);
                  if (subsSort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
                  if (subsSort === "az") {
                    const nameA = (a.profile.username || a.profile.display_name || "").toLowerCase();
                    const nameB = (b.profile.username || b.profile.display_name || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                  }
                  return 0;
                });

                if (sorted.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "56px", color: "var(--ma-border)", marginBottom: "16px" }}>
                        {subsPageTab === 'subbers' ? 'group' : 'music_note'}
                      </span>
                      <h3 style={{ color: "var(--ma-text-primary)", fontSize: "18px", margin: "0 0 8px 0" }}>{subsPageTab === 'subbers' ? 'No subscribers yet' : 'Your next favourite creator is waiting.'}</h3>
                      <p style={{ fontSize: "14px", color: "var(--ma-text-secondary)", margin: "0 0 20px 0" }}>{subsPageTab === 'subbers' ? 'When people subscribe to your channel, they will appear here.' : 'Discover music and videos from creators on .'}</p>
                      {subsPageTab === 'subs' && (
                        <button onClick={() => { setShowSubscriptionsPage(false); setCategory("All"); }} style={{ background: "#FF0033", color: "var(--ma-text)", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
                          Discover Creators
                        </button>
                      )}
                    </div>
                  );
                }

                return sorted.map((item, idx) => {
                  const p = item.profile;
                  if (!p) return null;
                  
                  return (
                    <div key={idx} onClick={() => { setShowSubscriptionsPage(false); openChannel(p.id); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--ma-bg-secondary)", border: "1px solid var(--ma-border)", borderRadius: "12px", padding: "16px", marginBottom: "12px", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
                        ) : (
                          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--ma-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "var(--ma-text-secondary)", flexShrink: 0 }}>
                            {(p.display_name || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", marginLeft: "12px", overflow: "hidden", flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--ma-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.username || p.display_name}</span>
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: p.role === 'artist' ? '#FF0033' : 'var(--ma-border)', color: "var(--ma-text-primary)", textTransform: "uppercase", fontWeight: 700, marginLeft: "8px", flexShrink: 0 }}>
                              {p.role === 'artist' ? 'Creator' : 'Listener'}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--ma-text-secondary)", marginTop: "4px" }}>
                            {subsPageTab === 'subbers' ? 'Subscribed' : 'Following since'} {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {subsPageTab === 'subs' && (
                        <button onClick={async (e) => {
                            e.stopPropagation();
                            if(window.confirm(`Unsubscribe from ${p.display_name || p.username}?`)) {
                              setUnsubscribingId(p.id);
                              try {
                                const { error } = await supabase.from("subscriptions").delete().eq("channel_id", p.id).eq("subscriber_id", session.user.id);
                                if (error) throw error;
                                setSubsList(prev => prev.filter(x => x.profile.id !== p.id));
                                setMessage("Unsubscribed successfully.");
                              } catch (err) {
                                setMessage("Failed to unsubscribe: " + err.message);
                              } finally {
                                setUnsubscribingId(null);
                              }
                            }
                          }} 
                          disabled={unsubscribingId === p.id}
                          style={{ background: "rgba(255, 0, 51, 0.1)", border: "1px solid #FF0033", color: "#FF0033", borderRadius: "12px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0, marginLeft: "12px", opacity: unsubscribingId === p.id ? 0.5 : 1 }}
                        >
                          {unsubscribingId === p.id ? "..." : "Unsubscribe"}
                        </button>
                      )}
                    </div>
                  );
                });
              })()
            )}
          </div>
        </section>
      )}


      <style>{`.ma-nav-yt button small, .ma-nav-yt button .material-symbols-outlined { color: var(--ma-text, #0f0f0f) !important; }`}</style>
    <nav className={"ma-mobile-nav ma-nav-yt" + (navVisible ? "" : " ma-mobile-nav-hidden")} aria-label="Main navigation">
        <button aria-label="Home" onClick={() => { closeAllOverlays(); setCategory("All"); setShowSubscriptionsFeed(false); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <span className="material-symbols-outlined">home</span><small>Home</small>
        </button>
        <button aria-label="Shorts" onClick={() => { closeAllOverlays(); setCategory("Videos"); setShowSubscriptionsFeed(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <span className="material-symbols-outlined">video_library</span><small>Shorts</small>
        </button>
        <button className="ma-create-nav" aria-label="Create" onClick={() => { if (profile?.role === "artist") { closeAllOverlays(); setShowUpload(true); window.scrollTo({ top: 0, behavior: "smooth" }); } else { setMessage("Become an Artist before uploading."); } }}>
          <span className="material-symbols-outlined">add</span>
        </button>
        <button aria-label="Subscriptions" onClick={() => { closeAllOverlays(); setShowSubscriptionsPage(true); setSubsPageTab("subbers"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <span className="material-symbols-outlined">subscriptions</span><small>Subscriptions</small>
        </button>
        <button aria-label="You" onClick={() => { closeAllOverlays(); setShowAccountPage(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          {profile?.avatar_url ? <img className="ma-nav-avatar" src={profile.avatar_url} alt="" /> : <span className="ma-nav-avatar ma-nav-avatar-fallback">{displayUser.charAt(0).toUpperCase()}</span>}
          <small>You</small>
        </button>
      </nav>
      
      
      {showEditPlaylistModal && selectedPlaylist && (
        <div
          onClick={() => !isSavingPlaylistEdit && setShowEditPlaylistModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", background: "rgba(0,0,0,.65)"
          }}
        >
          <form
            onSubmit={saveEditedPlaylist}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto",
              padding: "22px", borderRadius: "16px",
              background: "var(--ma-bg-primary, var(--ma-bg, #fff))",
              color: "var(--ma-text-primary, var(--ma-text, #111))",
              border: "1px solid var(--ma-border, #ddd)",
              display: "grid", gap: "14px"
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>Edit playlist</h2>
            <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
              Playlist title
              <input
                value={editPlaylistTitle}
                onChange={(e) => setEditPlaylistTitle(e.target.value)}
                maxLength={150}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px",
                  borderRadius: "8px", border: "1px solid var(--ma-border, #ccc)",
                  background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))",
                  color: "inherit"
                }}
              />
            </label>
            <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
              Description
              <textarea
                value={editPlaylistDescription}
                onChange={(e) => setEditPlaylistDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px",
                  borderRadius: "8px", border: "1px solid var(--ma-border, #ccc)",
                  background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))",
                  color: "inherit", resize: "vertical"
                }}
              />
            </label>
            <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
              Visibility
              <select
                value={editPlaylistVisibility}
                onChange={(e) => setEditPlaylistVisibility(e.target.value)}
                style={{
                  padding: "12px", borderRadius: "8px",
                  border: "1px solid var(--ma-border, #ccc)",
                  background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))",
                  color: "inherit"
                }}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" disabled={isSavingPlaylistEdit}
                onClick={() => setShowEditPlaylistModal(false)}
                style={{
                  padding: "10px 16px", borderRadius: "22px",
                  border: "1px solid var(--ma-border, #ccc)",
                  background: "transparent", color: "inherit"
                }}>Cancel</button>
              <button type="submit" disabled={isSavingPlaylistEdit}
                style={{
                  padding: "10px 18px", borderRadius: "22px", border: 0,
                  background: "var(--ma-accent, #ff0033)", color: "#fff",
                  fontWeight: 700
                }}>{isSavingPlaylistEdit ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {/* MA_PLAYLISTS_LIBRARY_PAGE */}
      {showAllPlaylists && !showPlaylistDetailPage && (
        <section className="ma-playlist-library-page" style={{
          position: "fixed", inset: "0 0 56px 0", zIndex: 99990,
          overflowY: "auto", background: "var(--ma-bg)", color: "var(--ma-text)",
          padding: "0 0 28px"
        }}>
          <header style={{
            position: "sticky", top: 0, zIndex: 3,
            display: "flex", alignItems: "center", gap: "18px",
            padding: "14px 18px", background: "var(--ma-bg)"
          }}>
            <button aria-label="Back" onClick={() => {
              setShowAllPlaylists(false);
              setShowAccountPage(true);
            }} style={{
              border: 0, padding: 0, background: "transparent",
              color: "var(--ma-text)", cursor: "pointer"
            }}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
              Playlists
            </h2>
          </header>

          {!session?.user?.id ? (
            <p style={{ padding: "20px" }}>Sign in to view your playlists.</p>
          ) : (
            <>
              <form onSubmit={handleCreatePlaylist} style={{
                display: "flex", gap: "10px", alignItems: "center",
                margin: "8px 16px 24px"
              }}>
                <input
                  aria-label="New playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Create a playlist"
                  required
                  style={{
                    flex: 1, minWidth: 0, padding: "13px 15px",
                    borderRadius: "24px", border: "1px solid var(--ma-border, #ccc)",
                    background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))",
                    color: "var(--ma-text-primary, var(--ma-text, #111))", fontSize: "14px"
                  }}
                />
                <button type="submit" style={{
                  border: 0, borderRadius: "22px", padding: "12px 17px",
                  background: "var(--ma-accent, #ff0033)", color: "#ffffff",
                  fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                }}>Create</button>
              </form>

              <div style={{
                display: "flex", flexWrap: "wrap", gap: "10px",
                margin: "0 16px 20px", alignItems: "center"
              }}>
                <input
                  type="search"
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder="Search your playlists"
                  aria-label="Search your playlists"
                  style={{
                    flex: "1 1 190px", minWidth: 0, padding: "12px 15px",
                    borderRadius: "22px", border: "1px solid var(--ma-border, #ccc)",
                    background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))",
                    color: "var(--ma-text-primary, var(--ma-text, #111))"
                  }}
                />
                <select
                  aria-label="Sort playlists"
                  value={playlistSort}
                  onChange={(e) => setPlaylistSort(e.target.value)}
                  style={{
                    padding: "12px", borderRadius: "22px",
                    border: "1px solid var(--ma-border, #ccc)",
                    background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))",
                    color: "var(--ma-text-primary, var(--ma-text, #111))"
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>

              {playlists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "44px 24px" }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize: "64px", color: "var(--ma-text-secondary)" }}>
                    video_library
                  </span>
                  <h3 style={{ fontSize: "18px", margin: "16px 0 8px" }}>
                    No playlists yet
                  </h3>
                  <p style={{ color: "var(--ma-text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
                    Create a playlist to collect the music and videos you want to play.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
                  gap: "24px 14px", padding: "0 16px"
                }}>
                  {visiblePlaylists.map((pl) => (
                    <button key={pl.id} onClick={async () => {
                      setSelectedPlaylist(pl);
                      setShowPlaylistDetailPage(true);
                      await openPlaylist(pl);
                    }} style={{
                      display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, padding: 0,
                      textAlign: "left", border: 0, background: "transparent",
                      color: "var(--ma-text)", cursor: "pointer", userSelect: "none"
                    }}>
                      <div style={{
                        position: "relative", aspectRatio: "16 / 10",
                        overflow: "hidden", borderRadius: "10px",
                        background: "var(--ma-bg-secondary, var(--ma-surface, #f5f5f5))", display: "grid",
                        placeItems: "center", marginBottom: "11px"
                      }}>
                        {pl.cover_url ? (
                          <img src={pl.cover_url} alt=""
                            loading="lazy"
                            style={{
                              width: "100%", height: "100%",
                              objectFit: "cover"
                            }} />
                        ) : (
                          <span className="material-symbols-outlined"
                            style={{ fontSize: "48px", color: "var(--ma-text-secondary)" }}>
                            queue_music
                          </span>
                        )}
                      </div>
                      <strong style={{
                        display: "block", fontSize: "14px", lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>{pl.title || "Untitled playlist"}</strong>
                      <span style={{
                        display: "block", color: "var(--ma-text-secondary)",
                        fontSize: "12px", marginTop: "5px"
                      }}>Open playlist</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
      {showPlaylistDetailPage && selectedPlaylist && (


        <section className="ma-playlist-detail-page" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: "56px", background: "var(--ma-bg, #fff)", zIndex: 99999, display: "flex", flexDirection: "column", overflowY: "auto", userSelect: "none" }}>
{showAddVideoToPlaylistModal && (
  <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,.65)", display: "grid", placeItems: "center", padding: "16px" }}>
    <section role="dialog" aria-modal="true" aria-label="Add video to playlist" style={{ width: "100%", maxWidth: "520px", maxHeight: "80vh", overflowY: "auto", background: "var(--ma-bg)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", borderRadius: "16px", padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>Add video to playlist</h2>
        <button type="button" onClick={() => setShowAddVideoToPlaylistModal(false)} style={{ background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", borderRadius: "10px", padding: "8px 12px", cursor: "pointer" }}>Close</button>
      </div>
      {playlistActionMessage && (
        <div role="status" aria-live="polite" style={{
          marginBottom: "12px", padding: "12px",
          border: "1px solid var(--ma-border)",
          borderRadius: "10px", background: "var(--ma-surface)",
          color: "var(--ma-text)", overflowWrap: "anywhere"
        }}>
          {playlistActionMessage}
        </div>
      )}
      {mediaPickerLoading ? (
        <p>Loading published media…</p>
      ) : mediaPickerItems.length === 0 ? (
        <p>No published media found.</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {mediaPickerItems.map((item) => (
            <div key={item.id} className="ma-add-video-row" onClick={() => addMediaToSelectedPlaylist(item)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", border: "1px solid var(--ma-border)", borderRadius: "12px", cursor: "pointer", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
              {item.thumbnail_path ? <img src={supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path).data.publicUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "76px", height: "54px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} /> : null}
              <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{item.title || "Untitled media"}</span>
              <button type="button" className="ma-add-video-button" onClick={(e) => { e.stopPropagation(); addMediaToSelectedPlaylist(item); }} style={{ background: "#e11d48", color: "#ffffff", WebkitTextFillColor: "#ffffff", border: "0", borderRadius: "10px", padding: "9px 12px", cursor: "pointer", flexShrink: 0, fontWeight: 700, opacity: 1, visibility: "visible" }}>Add</button>
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
)}

          
          {/* Top Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "transparent", position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}>
            <button onClick={() => { setShowPlaylistDetailPage(false); setSelectedPlaylistItems([]); setShowAllPlaylists(true); }} style={{ background: "var(--ma-surface)", border: "1px solid var(--ma-border)", borderRadius: "50%", color: "var(--ma-text)", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>arrow_back</span>
            </button>
            <div style={{ position: "relative" }}>
              <button type="button"
                aria-label="Playlist options"
                aria-expanded={showPlaylistDetailMenu}
                onClick={() => setShowPlaylistDetailMenu((open) => !open)}
                style={{ width: "40px", height: "40px", display: "grid", placeItems: "center", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", borderRadius: "50%", cursor: "pointer" }}>
                <span className="material-symbols-outlined">more_vert</span>
              </button>
              {showPlaylistDetailMenu && (
                <div role="menu" style={{ position: "absolute", top: "46px", right: 0, width: "210px", padding: "6px 0", background: "var(--ma-bg)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,.2)", zIndex: 100020 }}>
                  <button type="button" role="menuitem" onClick={() => { setShowPlaylistDetailMenu(false); openAddVideoToPlaylistPicker(); }} style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: "transparent", color: "var(--ma-text)", border: 0, cursor: "pointer" }}>Add videos</button>
                  <button type="button" role="menuitem" onClick={() => { setShowPlaylistDetailMenu(false); openEditPlaylistModal(); }} style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: "transparent", color: "var(--ma-text)", border: 0, cursor: "pointer" }}>Edit playlist</button>
                  <button type="button" role="menuitem" onClick={() => { setShowPlaylistDetailMenu(false); handleShare(selectedPlaylist); }} style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: "transparent", color: "var(--ma-text)", border: 0, cursor: "pointer" }}>Share playlist</button>
                  <button type="button" role="menuitem" onClick={() => setPlaylistDetailSort((sort) => sort === "newest" ? "oldest" : sort === "oldest" ? "title" : "newest")} style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: "transparent", color: "var(--ma-text)", border: 0, cursor: "pointer" }}>Change sort order</button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Banner Area */}
          <div style={{ position: "relative", width: "100%", height: "220px", background: "var(--ma-surface)" }}>
            <div style={{ width: "100%", height: "100%", backgroundImage: `url(${selectedPlaylist.cover_url || (playlistItems[0]?.thumbnail_path ? supabase.storage.from("track-covers").getPublicUrl(playlistItems[0].thumbnail_path).data.publicUrl : "")})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.9 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--ma-bg) 0%, transparent 100%)" }} />
            
            {/* Edit Cover Button (Only for owner) */}
            {selectedPlaylist.user_id === session?.user?.id && (
              <label style={{ position: "absolute", bottom: "16px", right: "16px", background: "var(--ma-bg)", width: "40px", height: "40px", borderRadius: "50%", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--ma-text)", fontSize: "20px" }}>{isUploadingCover ? "sync" : "edit"}</span>
                <input type="file" accept="image/*" onChange={handleUpdatePlaylistCover} disabled={isUploadingCover} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {/* Playlist Info */}
          <div style={{ padding: "0 16px 16px 16px", position: "relative", zIndex: 10, marginTop: "-20px" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: "900", color: "var(--ma-text)", letterSpacing: "-0.5px" }}>{selectedPlaylist.title}</h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <img src={channelProfile?.avatar_url || "https://via.placeholder.com/32"} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--ma-text)" }}>{channelProfile?.display_name || "Creator"}</span>
              <span style={{ fontSize: "14px", color: "var(--ma-text-secondary)" }}>•</span>
              <span style={{ fontSize: "14px", color: "var(--ma-text-secondary)" }}>{playlistItems.length} videos</span>
            </div>
            
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--ma-text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {selectedPlaylist.description || "No description provided."}
            </p>

            {/* Actions Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
              <button onClick={() => { if (playlistItems.length > 0) { setVideoQueue(playlistItems.slice(1)); openPlayer(playlistItems[0]); } }} disabled={playlistItems.length === 0} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", padding: "10px 20px", borderRadius: "24px", fontSize: "14px", fontWeight: "700", border: "none", cursor: playlistItems.length === 0 ? "not-allowed" : "pointer", opacity: playlistItems.length === 0 ? 0.5 : 1 }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> Play all
              </button>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <div role="button" tabIndex={0} aria-label="Add video to playlist" onClick={openAddVideoToPlaylistPicker} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openAddVideoToPlaylistPicker(); }} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--ma-surface)", display: "grid", placeItems: "center", cursor: "pointer", border: "1px solid var(--ma-border)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--ma-text)" }}>add</span>
                </div>
                <div onClick={openEditPlaylistModal} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--ma-surface)", display: "grid", placeItems: "center", cursor: "pointer", border: "1px solid var(--ma-border)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--ma-text)" }}>edit</span>
                </div>
                <div onClick={() => handleShare(selectedPlaylist)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--ma-surface)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--ma-text)" }}>share</span>
                </div>
                <div onClick={() => setMessage("Download feature coming soon")} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--ma-surface)", display: "grid", placeItems: "center", cursor: "pointer", border: "1px solid var(--ma-border)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--ma-text)" }}>download</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and sort playlist items */}
          <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0, padding: "0 12px", background: "var(--ma-surface)", border: "1px solid var(--ma-border)", borderRadius: "12px", color: "var(--ma-text)" }}>
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                type="search"
                aria-label="Search videos in this playlist"
                placeholder="Search this playlist"
                value={playlistDetailSearch}
                onChange={(e) => setPlaylistDetailSearch(e.target.value)}
                style={{ width: "100%", minWidth: 0, padding: "11px 0", background: "transparent", color: "var(--ma-text)", border: 0, outline: "none", fontSize: "14px" }}
              />
              {playlistDetailSearch && (
                <button type="button" aria-label="Clear playlist search" onClick={() => setPlaylistDetailSearch("")} style={{ background: "transparent", color: "var(--ma-text)", border: 0, cursor: "pointer" }}>×</button>
              )}
            </div>
            <select aria-label="Sort playlist videos" value={playlistDetailSort} onChange={(e) => setPlaylistDetailSort(e.target.value)} style={{ maxWidth: "120px", padding: "10px 6px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", borderRadius: "10px" }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          {/* Video List */}
          <div style={{ padding: "0 16px", flex: 1, paddingBottom: "100px" }}>
            {playlistLoading ? (
              <p style={{ textAlign: "center", color: "var(--ma-text-secondary)", marginTop: "20px" }}>Loading videos...</p>
            ) : visiblePlaylistItems.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--ma-text-secondary)", marginTop: "20px" }}>
                {playlistItems.length === 0 ? "This playlist is empty." : "No videos match your search."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {visiblePlaylistItems.map((item) => {
                  return (
                  <div key={item.playlistItemId || item.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", position: "relative" }}>
                    
                    {/* Thumbnail */}
                    <div onClick={() => openPlayer(item)} style={{ width: "140px", height: "80px", borderRadius: "8px", overflow: "hidden", background: "var(--ma-surface)", flexShrink: 0, position: "relative", cursor: "pointer" }}>
                      {item.thumbnail_path ? (
                        <img src={item.thumbnailUrl || supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path).data.publicUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ma-text-secondary)", fontSize: "24px" }}>♫</div>
                      )}
                      <div style={{ position: "absolute", bottom: "4px", right: "4px", background: "rgba(0,0,0,0.8)", color: "var(--ma-text)", fontSize: "10px", fontWeight: "bold", padding: "2px 4px", borderRadius: "4px" }}>
                        {item.media_type === "video" ? "VIDEO" : "AUDIO"}
                      </div>
                    </div>

                    {/* Title and Meta */}
                    <div onClick={() => openPlayer(item)} style={{ flex: 1, minWidth: 0, cursor: "pointer", paddingTop: "4px" }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--ma-text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--ma-text-secondary)", fontWeight: "600" }}>{item.profiles?.display_name || "Artist"}</p>
                    </div>

                    {/* 3-Dots Menu Trigger */}
                    <button onClick={(e) => { e.stopPropagation(); setActivePlaylistItemMenu(activePlaylistItemMenu === item.playlistItemId ? null : item.playlistItemId); }} style={{ background: "transparent", border: "none", color: "var(--ma-text)", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_vert</span>
                    </button>

                    {/* Dropdown Menu */}
                    {activePlaylistItemMenu === item.playlistItemId && (
                      <div style={{ position: "absolute", right: "0", top: "30px", background: "var(--ma-bg)", border: "1px solid var(--ma-border)", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 30, display: "flex", flexDirection: "column", width: "220px", padding: "8px 0" }}>
                        
                        <button onClick={() => { addToQueue(item, "next"); setActivePlaylistItemMenu(null); }} style={{ padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--ma-text)", fontWeight: "500", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary)" }}>play_circle</span> Play next in queue
                        </button>
                        
                        <button onClick={() => { addToQueue(item, "last"); setActivePlaylistItemMenu(null); }} style={{ padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--ma-text)", fontWeight: "500", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary)" }}>playlist_add</span> Play last in queue
                        </button>

                        <button onClick={() => { handleSaveToWatchLater(item); setActivePlaylistItemMenu(null); }} style={{ padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--ma-text)", fontWeight: "500", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary)" }}>schedule</span> Save to Watch later
                        </button>

                        <button onClick={() => { setActiveMedia(item); setShowPlaylistModal(true); setActivePlaylistItemMenu(null); }} style={{ padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--ma-text)", fontWeight: "500", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary)" }}>playlist_add</span> Save to playlist
                        </button>

                        {selectedPlaylist?.user_id === session?.user?.id && (
                          <button onClick={() => { handleDeletePlaylistItem(item.playlistItemId); setActivePlaylistItemMenu(null); }} style={{ padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--ma-text)", fontWeight: "500", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary)" }}>remove_circle</span> Remove from {selectedPlaylist.title}
                          </button>
                        )}

                        <button onClick={() => { handleShare(item); setActivePlaylistItemMenu(null); }} style={{ padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--ma-text)", fontWeight: "500", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--ma-text-secondary)" }}>share</span> Share
                        </button>
                        
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        </section>
      )}

      {showPlaylistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowPlaylistModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "90%", maxWidth: "400px", borderRadius: "16px", padding: "24px", border: "1px solid var(--ma-border, #e5e5e5)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto", userSelect: "none", WebkitUserSelect: "none" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Save to playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", cursor: "pointer", display: "flex" }}><span className="material-symbols-outlined">close</span></button>
            </div>

            {/* List of Playlists */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {playlists.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--ma-text-secondary)", textAlign: "center", margin: "10px 0" }}>No playlists yet. Create one below!</p>
              ) : (
                playlists.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--ma-surface)", padding: "14px", borderRadius: "12px", border: "1px solid var(--ma-border)" }}>
                    
                    {/* Clickable Title to View Playlist */}
                    <div 
                      onClick={() => { openPlaylist(p); setShowPlaylistModal(false); }} 
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                    >
                      <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>playlist_play</span>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--ma-text)", textDecoration: "underline" }}>{p.title}</span>
                      <span style={{ fontSize: "11px", color: "var(--ma-text-secondary)", marginLeft: "auto" }}>View</span>
                    </div>

                    {/* Add Button Failsafe */}
                    <div style={{ width: "100%", backgroundColor: "#ff365f", borderRadius: "10px", display: "flex", justifyContent: "center", boxShadow: "0 4px 12px rgba(255,54,95,0.2)" }}>
                      <button onClick={() => handleAddToPlaylist(p.id, p.title)} style={{ width: "100%", background: "transparent", color: "#ffffff", border: "none", padding: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                        Add to this playlist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: "1px", background: "var(--ma-border)", margin: "20px 0" }} />

            {/* Create New Playlist Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              
              <input 
                type="text" 
                placeholder="New playlist name..." 
                value={newPlaylistName} 
                onChange={e => setNewPlaylistName(e.target.value)} 
                style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", outline: "none", display: "block" }} 
              />
              
              <button 
                type="button" 
                onClick={handleCreateNewPlaylist}
                style={{ 
                  width: "100%", 
                  backgroundColor: "#ff365f", 
                  color: "#ffffff", 
                  border: "none", 
                  padding: "14px", 
                  borderRadius: "10px", 
                  fontWeight: "bold", 
                  fontSize: "15px", 
                  cursor: "pointer", 
                  display: "flex", 
                  justifyContent: "center", 
                  boxShadow: "0 4px 12px rgba(255,54,95,0.3)" 
                }}
              >
                Create Playlist
              </button>
            </div>

          </div>
        </div>
      )}

      {showAddSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowAddSuccessModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "85%", maxWidth: "320px", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(43, 166, 64, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ color: "#2BA640", fontSize: "24px" }}>check_circle</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Video Added!</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--ma-text-secondary, #666)" }}>Successfully added to <strong>{addedPlaylistTitle}</strong>.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { setShowAddSuccessModal(false); setShowPlaylistDetailPage(false); setTimeout(() => { const pl = channelPlaylists.find(p => p.id === addedPlaylistId) || playlists.find(p => p.id === addedPlaylistId); if (pl) openPlaylist(pl); }, 100); }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#ff365f", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,54,95,0.3)" }}>
                View Playlist
              </button>
              <button onClick={() => setShowAddSuccessModal(false)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)", background: "transparent", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoreMenu && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2147483647, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={() => setShowMoreMenu(null)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "100%", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px 20px 40px 20px", boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--ma-surface)" }}>
                {showMoreMenu.thumbnailUrl ? <img src={showMoreMenu.thumbnailUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>♫</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{showMoreMenu.title}</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>{showMoreMenu.profiles?.display_name || "Artist"}</p>
              </div>
              <button onClick={() => setShowMoreMenu(null)} style={{ background: "var(--ma-surface)", border: 0, borderRadius: "50%", width: "32px", height: "32px", display: "grid", placeItems: "center", color: "var(--ma-text)", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              
              {/* Playback Speed */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase" }}>Playback Speed</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 1.25, 1.5, 2].map(speed => (
                    <button key={speed} onClick={() => {
                      const mediaEl = document.querySelector('video') || document.querySelector('audio');
                      if (mediaEl) { mediaEl.playbackRate = speed; setMessage(`Speed: ${speed}x`); }
                      else { setMessage("Player not ready."); }
                      setShowMoreMenu(null);
                    }} style={{ flex: 1, padding: "8px 0", background: "var(--ma-surface)", border: "1px solid var(--ma-border)", borderRadius: "8px", color: "var(--ma-text)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Share */}
              <button onClick={() => { handleShare(showMoreMenu); setShowMoreMenu(null); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: 0, padding: "16px 0", fontSize: "15px", fontWeight: "600", color: "var(--ma-text)", cursor: "pointer", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>share</span> Share Link
              </button>

              {/* Save to Playlist */}
              {session?.user?.id && (
                <button onClick={() => { setActiveMedia(showMoreMenu); setShowPlaylistModal(true); setShowMoreMenu(null); fetchUserPlaylistsForModal(); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: 0, padding: "16px 0", fontSize: "15px", fontWeight: "600", color: "var(--ma-text)", cursor: "pointer", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>playlist_add</span> Save to Playlist
                </button>
              )}

              {/* Report */}
              <button onClick={() => { handleReportVideo(showMoreMenu.id); setShowMoreMenu(null); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: 0, padding: "16px 0", fontSize: "15px", fontWeight: "600", color: "#FF4E45", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ color: "#FF4E45" }}>flag</span> Report Video
              </button>

            </div>
          </div>
        </div>, document.body
      )}

      {showPlaylistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowPlaylistModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "90%", maxWidth: "400px", borderRadius: "16px", padding: "24px", border: "1px solid var(--ma-border, #e5e5e5)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto", userSelect: "none", WebkitUserSelect: "none" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Save to playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", cursor: "pointer", display: "flex" }}><span className="material-symbols-outlined">close</span></button>
            </div>

            {/* List of Playlists */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {playlists.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--ma-text-secondary)", textAlign: "center", margin: "10px 0" }}>No playlists yet. Create one below!</p>
              ) : (
                playlists.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--ma-surface)", padding: "12px", borderRadius: "12px", border: "1px solid var(--ma-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>playlist_play</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--ma-text)" }}>{p.title}</span>
                    </div>
                    <div style={{ width: "100%", backgroundColor: "#ff365f", borderRadius: "8px", boxShadow: "0 4px 12px rgba(255,54,95,0.3)", display: "flex", justifyContent: "center" }}>
                      <button onClick={() => handleAddToPlaylist(p.id, p.title)} style={{ width: "100%", background: "transparent", color: "#ffffff", border: "none", padding: "10px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
                        Add to this playlist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: "1px", background: "var(--ma-border)", margin: "20px 0" }} />

            {/* Create New Playlist Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <input 
                type="text" 
                placeholder="New playlist name..." 
                value={newPlaylistName} 
                onChange={e => setNewPlaylistName(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!newPlaylistName.trim()) return;
                    (async () => {
                      try {
                        const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
                        if (error) throw error;
                        if (activeMedia?.id) {
                          await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
                        }
                        setPlaylists(prev => [data, ...prev]);
                        setNewPlaylistName("");
                        setShowPlaylistModal(false);
                        setAddedPlaylistId(data.id);
                        setAddedPlaylistTitle(data.title);
                        setShowAddSuccessModal(true);
                        setMessage("Playlist created successfully!");
                      } catch(err) {
                        setMessage("Error: " + err.message);
                      }
                    })();
                  }
                }}
                style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", outline: "none", display: "block", fontSize: "14px" }} 
              />
              
              <div 
                onClick={async () => {
                  if (!newPlaylistName.trim()) return;
                  try {
                    const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
                    if (error) throw error;
                    if (activeMedia?.id) {
                      await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
                    }
                    setPlaylists(prev => [data, ...prev]);
                    setNewPlaylistName("");
                    setShowPlaylistModal(false);
                    setAddedPlaylistId(data.id);
                    setAddedPlaylistTitle(data.title);
                    setShowAddSuccessModal(true);
                    setMessage("Playlist created successfully!");
                  } catch(err) {
                    setMessage("Error: " + err.message);
                  }
                }}
                style={{
                  width: "100%",
                  backgroundColor: "#ff365f",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 4px 12px rgba(255,54,95,0.3)",
                  cursor: "pointer",
                  padding: "14px",
                  userSelect: "none"
                }}
              >
                <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "15px", pointerEvents: "none" }}>
                  Create Playlist
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {showAddSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowAddSuccessModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "85%", maxWidth: "320px", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(43, 166, 64, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ color: "#2BA640", fontSize: "24px" }}>check_circle</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Video Added!</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--ma-text-secondary, #666)" }}>Successfully added to <strong>{addedPlaylistTitle}</strong>.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { setShowAddSuccessModal(false); setShowPlaylistDetailPage(false); setTimeout(() => { const pl = channelPlaylists.find(p => p.id === addedPlaylistId) || playlists.find(p => p.id === addedPlaylistId); if (pl) openPlaylist(pl); }, 100); }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#ff365f", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,54,95,0.3)" }}>
                View Playlist
              </button>
              <button onClick={() => setShowAddSuccessModal(false)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)", background: "transparent", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoreMenu && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2147483647, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={() => setShowMoreMenu(null)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "100%", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px 20px 40px 20px", boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--ma-surface)" }}>
                {showMoreMenu.thumbnailUrl ? <img src={showMoreMenu.thumbnailUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>♫</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{showMoreMenu.title}</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>{showMoreMenu.profiles?.display_name || "Artist"}</p>
              </div>
              <button onClick={() => setShowMoreMenu(null)} style={{ background: "var(--ma-surface)", border: 0, borderRadius: "50%", width: "32px", height: "32px", display: "grid", placeItems: "center", color: "var(--ma-text)", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              
              {/* Playback Speed */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", color: "var(--ma-text-secondary, #666)", textTransform: "uppercase" }}>Playback Speed</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 1.25, 1.5, 2].map(speed => (
                    <button key={speed} onClick={() => {
                      const mediaEl = document.querySelector('video') || document.querySelector('audio');
                      if (mediaEl) { mediaEl.playbackRate = speed; setMessage(`Speed: ${speed}x`); }
                      else { setMessage("Player not ready."); }
                      setShowMoreMenu(null);
                    }} style={{ flex: 1, padding: "8px 0", background: "var(--ma-surface)", border: "1px solid var(--ma-border)", borderRadius: "8px", color: "var(--ma-text)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Share */}
              <button onClick={() => { handleShare(showMoreMenu); setShowMoreMenu(null); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: 0, padding: "16px 0", fontSize: "15px", fontWeight: "600", color: "var(--ma-text)", cursor: "pointer", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>share</span> Share Link
              </button>

              {/* Save to Playlist */}
              {session?.user?.id && (
                <button onClick={() => { setActiveMedia(showMoreMenu); setShowPlaylistModal(true); setShowMoreMenu(null); fetchUserPlaylistsForModal(); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: 0, padding: "16px 0", fontSize: "15px", fontWeight: "600", color: "var(--ma-text)", cursor: "pointer", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>playlist_add</span> Save to Playlist
                </button>
              )}

              {/* Report */}
              <button onClick={() => { handleReportVideo(showMoreMenu.id); setShowMoreMenu(null); }} style={{ display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: 0, padding: "16px 0", fontSize: "15px", fontWeight: "600", color: "#FF4E45", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ color: "#FF4E45" }}>flag</span> Report Video
              </button>

            </div>
          </div>
        </div>, document.body
      )}

      {showPlaylistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowPlaylistModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "90%", maxWidth: "400px", borderRadius: "16px", padding: "24px", border: "1px solid var(--ma-border, #e5e5e5)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Save to playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", cursor: "pointer", display: "flex" }}><span className="material-symbols-outlined">close</span></button>
            </div>

            <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {playlists.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--ma-text-secondary)" }}>No playlists yet. Create one below!</p>
              ) : (
                playlists.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--ma-surface)", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>playlist_play</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--ma-text)" }}>{p.title}</span>
                    </div>
                    <div style={{ width: "100%", backgroundColor: "#ff365f", borderRadius: "8px", boxShadow: "0 4px 12px rgba(255,54,95,0.3)", marginTop: "10px", display: "block" }}>
                      <button onClick={() => handleAddToPlaylist(p.id, p.title)} style={{ width: "100%", display: "flex", justifyContent: "center", background: "transparent", color: "#ffffff", border: "none", padding: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                        Add to this playlist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: "1px", background: "var(--ma-border)", margin: "16px 0" }} />

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newPlaylistName.trim()) return;
              try {
                const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
                if (error) throw error;

                if (activeMedia?.id) {
                  await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
                }

                setPlaylists(prev => [data, ...prev]);
                setNewPlaylistName("");
                setShowPlaylistModal(false);

                setAddedPlaylistId(data.id);
                setAddedPlaylistTitle(data.title);
                setShowAddSuccessModal(true);
              } catch(err) {
                setMessage("Error creating playlist: " + err.message);
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <input type="text" placeholder="New playlist name..." value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", outline: "none", display: "block" }} />
              <button type="submit" style={{ flexShrink: 0, background: "#ff365f !important", color: "white !important", border: "none !important", padding: "0 20px", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex !important", alignItems: "center", justifyContent: "center", minHeight: "44px" }}>Create</button>
            </form>

          </div>
        </div>
      )}

      {showAddSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowAddSuccessModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "85%", maxWidth: "320px", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(43, 166, 64, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ color: "#2BA640", fontSize: "24px" }}>check_circle</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Video Added!</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--ma-text-secondary, #666)" }}>Successfully added to <strong>{addedPlaylistTitle}</strong>.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { setShowAddSuccessModal(false); setShowPlaylistDetailPage(false); setTimeout(() => { const pl = channelPlaylists.find(p => p.id === addedPlaylistId) || playlists.find(p => p.id === addedPlaylistId); if (pl) openPlaylist(pl); }, 100); }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#ff365f", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,54,95,0.3)" }}>
                View Playlist
              </button>
              <button onClick={() => setShowAddSuccessModal(false)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)", background: "transparent", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowPlaylistModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "90%", maxWidth: "400px", borderRadius: "16px", padding: "24px", border: "1px solid var(--ma-border, #e5e5e5)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Save to playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", cursor: "pointer", display: "flex" }}><span className="material-symbols-outlined">close</span></button>
            </div>

            <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {playlists.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--ma-text-secondary)" }}>No playlists yet. Create one below!</p>
              ) : (
                playlists.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--ma-surface)", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)" }}>playlist_play</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--ma-text)" }}>{p.title}</span>
                    </div>
                    <div style={{ width: "100%", backgroundColor: "#ff365f", borderRadius: "8px", boxShadow: "0 4px 12px rgba(255,54,95,0.3)", marginTop: "10px", display: "block" }}>
                      <button onClick={() => handleAddToPlaylist(p.id, p.title)} style={{ width: "100%", display: "flex", justifyContent: "center", background: "transparent", color: "#ffffff", border: "none", padding: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                        Add to this playlist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: "1px", background: "var(--ma-border)", margin: "16px 0" }} />

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newPlaylistName.trim()) return;
              try {
                const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
                if (error) throw error;

                if (activeMedia?.id) {
                  await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
                }

                setPlaylists(prev => [data, ...prev]);
                setNewPlaylistName("");
                setShowPlaylistModal(false);

                setAddedPlaylistId(data.id);
                setAddedPlaylistTitle(data.title);
                setShowAddSuccessModal(true);
              } catch(err) {
                setMessage("Error creating playlist: " + err.message);
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <input type="text" placeholder="New playlist name..." value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", outline: "none", display: "block" }} />
              <button type="submit" style={{ flexShrink: 0, background: "#ff365f !important", color: "white !important", border: "none !important", padding: "0 20px", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex !important", alignItems: "center", justifyContent: "center", minHeight: "44px" }}>Create</button>
            </form>

          </div>
        </div>
      )}

      {showAddSuccessModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowAddSuccessModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "85%", maxWidth: "320px", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(43, 166, 64, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ color: "#2BA640", fontSize: "24px" }}>check_circle</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Video Added!</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--ma-text-secondary, #666)" }}>Successfully added to <strong>{addedPlaylistTitle}</strong>.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { setShowAddSuccessModal(false); setShowPlaylistDetailPage(false); setTimeout(() => { const pl = channelPlaylists.find(p => p.id === addedPlaylistId) || playlists.find(p => p.id === addedPlaylistId); if (pl) openPlaylist(pl); }, 100); }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#ff365f", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,54,95,0.3)" }}>
                View Playlist
              </button>
              <button onClick={() => setShowAddSuccessModal(false)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)", background: "transparent", color: "var(--ma-text)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowPlaylistModal(false)}>
          <div style={{ background: "var(--ma-bg, #fff)", color: "var(--ma-text, #000)", width: "90%", maxWidth: "400px", borderRadius: "16px", padding: "24px", border: "1px solid var(--ma-border, #e5e5e5)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Save to playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", cursor: "pointer" }}><span className="material-symbols-outlined">close</span></button>
            </div>

            <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {playlists.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--ma-text-secondary)" }}>No playlists yet. Create one below!</p>
              ) : (
                playlists.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--ma-surface)", padding: "12px", borderRadius: "10px", border: "1px solid var(--ma-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--ma-text-secondary)", flexShrink: 0 }}>playlist_play</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
                    </div>
                    <button onClick={() => handleAddToPlaylist(p.id, p.title)} style={{ flexShrink: 0, background: "#ff365f", color: "var(--ma-text)", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Add</button>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: "1px", background: "var(--ma-border)", margin: "16px 0" }} />

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newPlaylistName.trim()) return;
              try {
                const { data, error } = await supabase.from("playlists").insert({ user_id: session.user.id, title: newPlaylistName.trim(), visibility: 'public' }).select().single();
                if (error) throw error;
                
                if (activeMedia?.id) {
                  await supabase.from('playlist_items').insert({ playlist_id: data.id, media_id: activeMedia.id, position: 0 });
                }

                setPlaylists(prev => [data, ...prev]);
                setNewPlaylistName("");
                setShowPlaylistModal(false);
                
                setAddedPlaylistId(data.id);
                setAddedPlaylistTitle(data.title);
                setShowAddSuccessModal(true);
              } catch(err) {
                setMessage("Error creating playlist: " + err.message);
              }
            }} style={{ display: "flex", gap: "8px", width: "100%" }}>
              <input type="text" placeholder="New playlist name..." value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} style={{ flex: 1, minWidth: 0, padding: "12px", borderRadius: "10px", background: "var(--ma-surface)", color: "var(--ma-text)", border: "1px solid var(--ma-border)", outline: "none" }} />
              <button type="submit" style={{ flexShrink: 0, background: "#ff365f", color: "var(--ma-text)", border: "none", padding: "0 20px", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>Create</button>
            </form>

          </div>
        </div>
      )}

      {showCommentsModal && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowCommentsModal(false)}
        >
          <div 
            style={{ background: "var(--ma-bg, #fff)", height: "85vh", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--ma-border, #e5e5e5)" }}>
              <h3 style={{ margin: 0, color: "var(--ma-text, #000)", fontSize: "15px", fontWeight: "600" }}>Comments ({comments.length})</h3>
              <button onClick={() => setShowCommentsModal(false)} style={{ background: "transparent", border: 0, color: "var(--ma-text, #000)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "100px" }}>
              {comments.length === 0 ? (
                <p style={{ color: "var(--ma-text-secondary, #666)", textAlign: "center", marginTop: "40px" }}>No comments yet. Be the first!</p>
              ) : (
                comments.filter(c => !c.parent_id).map(c => (
                  <div key={c.id} style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start", textAlign: "left" }}>
                    
                    {/* Avatar - Smaller */}
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#ff365f", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", color: "var(--ma-text)", fontSize: "12px" }}>
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "♫"}
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                      
                      {/* Name & Time - Compact */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--ma-text, #000)" }}>
                          @{c.profiles?.display_name || "user"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#aaaaaa" }}>
                          {timeAgo(c.created_at)}
                        </span>
                        {c.is_pinned && (
                          <span style={{ fontSize: "10px", color: "var(--ma-accent)", display: "flex", alignItems: "center", gap: "2px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>push_pin</span>
                          </span>
                        )}
                      </div>

                      {/* Text Content */}
                      {editingCommentId === c.id ? (
                        <div style={{ width: "100%", marginBottom: "6px" }}>
                          <input value={editCommentText} onChange={e => setEditCommentText(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--ma-border, #e5e5e5)", background: "var(--ma-surface, #f2f2f2)", color: "var(--ma-text, #000)", fontSize: "13px", marginBottom: "8px", outline: "none" }} />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => setEditingCommentId(null)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", fontSize: "11px" }}>Cancel</button>
                            <button onClick={() => handleUpdateComment(c.id)} style={{ background: "#ff365f", border: 0, borderRadius: "12px", padding: "4px 12px", color: "#ffffff", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: "100%", marginBottom: "4px" }}>
                          {c.content && <p style={{ margin: 0, fontSize: "13px", color: "var(--ma-text, #000)", lineHeight: 1.3, wordWrap: "break-word" }}>{c.content}</p>}
                          {c.image_url && <img src={c.image_url} style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "6px", marginTop: "6px" }} />}
                          {c.audio_url && (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--ma-surface, #f2f2f2)", padding: "10px 14px", borderRadius: "16px", border: "1px solid var(--ma-border, #e5e5e5)", marginTop: "10px", width: "100%", maxWidth: "340px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                            <button 
                              onClick={() => {
                                if (playingCommentId === c.id) {
                                  if (playingCommentRef.current.paused) playingCommentRef.current.play();
                                  else playingCommentRef.current.pause();
                                } else {
                                  if (playingCommentRef.current) {
                                    playingCommentRef.current.src = c.audio_url;
                                    playingCommentRef.current.playbackRate = 1;
                                    playingCommentRef.current.play();
                                  }
                                  setPlayingCommentId(c.id);
                                  setPlayingCommentSpeed(1);
                                }
                              }} 
                              style={{ background: "transparent", border: 0, color: "var(--ma-text, #000)", cursor: "pointer", display: "flex", padding: 0 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                                {playingCommentId === c.id && !playingCommentRef.current?.paused ? "pause_circle" : "play_circle"}
                              </span>
                            </button>

                            <span style={{ fontSize: "12px", color: "var(--ma-text, #000)", minWidth: "28px", fontWeight: "600" }}>
                              {playingCommentId === c.id ? formatVoiceTime(playingCommentProgress) : "0:00"}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "20px", flex: 1 }}>
                              {Array.from({ length: 35 }).map((_, i) => {
                                const isActive = playingCommentId === c.id && (playingCommentProgress / (playingCommentDuration || 1)) > (i / 35);
                                const height = 4 + (Math.sin(i * 0.5) * 4) + (i % 3 === 0 ? 4 : 0);
                                return <div key={i} style={{ width: "2px", height: `${Math.max(3, height)}px`, borderRadius: "1px", background: isActive ? "#ff365f" : "var(--ma-border, #e5e5e5)" }} />;
                              })}
                            </div>

                            <button 
                              onClick={() => {
                                const speeds = [1, 1.5, 2];
                                const nextSpeed = speeds[(speeds.indexOf(playingCommentSpeed) + 1) % speeds.length];
                                setPlayingCommentSpeed(nextSpeed);
                                if (playingCommentRef.current) playingCommentRef.current.playbackRate = nextSpeed;
                              }} 
                              style={{ background: "var(--ma-bg, #fff)", border: "1px solid var(--ma-border, #e5e5e5)", borderRadius: "6px", color: "var(--ma-text, #000)", width: "28px", height: "22px", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}
                            >
                              {playingCommentId === c.id ? `${playingCommentSpeed}x` : "1x"}
                            </button>

                            {/* Hidden Audio for playback */}
                            <audio 
                              ref={playingCommentId === c.id ? playingCommentRef : null}
                              src={c.audio_url}
                              preload="metadata"
                              onTimeUpdate={(e) => setPlayingCommentProgress(e.target.currentTime)}
                              onLoadedMetadata={(e) => {
                                if (e.target.duration && e.target.duration !== Infinity) {
                                  setPlayingCommentDuration(e.target.duration);
                                }
                              }}
                              onEnded={() => { setPlayingCommentId(null); setPlayingCommentProgress(0); }}
                              onPlay={() => { document.querySelectorAll('audio, video').forEach(el => { if (el !== playingCommentRef.current) el.pause(); }); }}
                              style={{ display: "none" }}
                            />
                          </div>
                        )}
                          
                          {/* Creator Heart inline with text */}
                          {c.has_creator_heart && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginTop: "2px", fontSize: "11px", color: "#ff365f" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "12px", fontVariationSettings: "'FILL' 1" }}>favorite</span> Creator
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Row - Tighter */}
                      {editingCommentId !== c.id && (
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", width: "100%", marginTop: "8px" }}>
                          <button onClick={(e) => handleLikeComment(c.id, c.likes || 0, e)} style={{ background: "transparent", border: 0, color: likedComments.includes(c.id) ? "#ff365f" : "var(--ma-text-secondary, #666)", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", padding: 0, cursor: "pointer" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: likedComments.includes(c.id) ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span> {c.likes || 0}
                          </button>
                          
                          <button onClick={() => { setExpandedReplies(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]); setReplyTarget(c.id); setReplyingToName(c.profiles?.display_name || "user"); }} style={{ background: "transparent", border: 0, color: expandedReplies.includes(c.id) ? "var(--ma-text, #000)" : "var(--ma-text-secondary, #666)", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", padding: 0, cursor: "pointer", fontWeight: expandedReplies.includes(c.id) ? "600" : "normal" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chat_bubble</span> Reply {comments.filter(r => r.parent_id === c.id).length > 0 && `(${comments.filter(r => r.parent_id === c.id).length})`}
                          </button>

                          {(session?.user?.id === activeMedia.artist_id) && (
                            <>
                              <button onClick={() => handlePinComment(c.id, c.is_pinned)} style={{ background: "transparent", border: 0, color: c.is_pinned ? "#3ea6ff" : "#aaa", display: "flex", alignItems: "center", padding: 0, cursor: "pointer" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>push_pin</span>
                              </button>
                              <button onClick={() => handleCreatorHeart(c.id, c.has_creator_heart)} style={{ background: "transparent", border: 0, color: c.has_creator_heart ? "#ff365f" : "var(--ma-text-secondary, #666)", display: "flex", alignItems: "center", padding: 0, cursor: "pointer" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: c.has_creator_heart ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                              </button>
                            </>
                          )}

                          {(session?.user?.id === activeMedia.artist_id || session?.user?.id === c.user_id) && (
                            <>
                              <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", fontSize: "12px", fontWeight: "600", padding: 0, cursor: "pointer", marginLeft: "auto" }}>Edit</button>
                              <button onClick={() => setDeletingCommentId(c.id)} style={{ background: "transparent", border: 0, color: "#ff365f", fontSize: "12px", fontWeight: "600", padding: 0, cursor: "pointer" }}>Delete</button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Nested Replies */}
                      {expandedReplies.includes(c.id) && (
                        <div style={{ marginLeft: "36px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px", borderLeft: "2px solid var(--ma-border, #e5e5e5)", paddingLeft: "12px" }}>
                          {comments.filter(r => r.parent_id === c.id).map(reply => (
                            <div key={reply.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                                {reply.profiles?.avatar_url ? <img src={reply.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "#ff365f", color: "var(--ma-text)", display: "grid", placeItems: "center", fontSize: "12px" }}>♫</div>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ma-text, #000)" }}>@{reply.profiles?.display_name || "user"}</span>
                                  <span style={{ fontSize: "10px", color: "var(--ma-text-secondary, #666)" }}>{timeAgo(reply.created_at)}</span>
                                </div>
                                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--ma-text, #000)", lineHeight: 1.3 }}>{reply.content}</p>
                                <button
                                  onClick={(e) => handleLikeComment(reply.id, reply.likes || 0, e)}
                                  style={{
                                    background: "transparent",
                                    border: 0,
                                    color: likedComments.includes(reply.id) ? "#ff365f" : "var(--ma-text-secondary, #666)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    fontSize: "11px",
                                    padding: 0,
                                    marginTop: "6px",
                                    cursor: "pointer"
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      fontSize: "14px",
                                      fontVariationSettings: likedComments.includes(reply.id) ? "'FILL' 1" : "'FILL' 0"
                                    }}
                                  >thumb_up</span>
                                  {reply.likes || 0}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--ma-bg, #fff)", borderTop: "1px solid var(--ma-border, #e5e5e5)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 -4px 12px rgba(0,0,0,0.03)", zIndex: 10 }}>
              
              {replyTarget && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px", color: "var(--ma-text-secondary, #666)" }}>
                  <span>Replying to <strong>@{replyingToName}</strong></span>
                  <button onClick={() => { setReplyTarget(null); setReplyingToName(""); }} style={{ background: "transparent", border: 0, color: "var(--ma-accent)", cursor: "pointer" }}>Cancel</button>
                </div>
              )}

              <form onSubmit={handlePostComment} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                
                {(commentImage || commentAudioUrl) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "var(--ma-surface, #f0f0f0)", borderRadius: "12px", border: "1px solid var(--ma-border, #e5e5e5)" }}>
                    
                    {commentImage && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <img src={URL.createObjectURL(commentImage)} style={{ height: "60px", borderRadius: "6px" }} />
                        <button type="button" onClick={() => setCommentImage(null)} style={{ background: "transparent", border: 0, color: "#ff365f", fontSize: "12px", cursor: "pointer" }}>Remove</button>
                      </div>
                    )}

                    {commentAudioUrl && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        
                        <audio 
                          ref={voicePreviewRef}
                          src={commentAudioUrl}
                          onTimeUpdate={(e) => setVoicePreviewProgress(e.target.currentTime)}
                          onLoadedMetadata={(e) => setVoicePreviewDuration(e.target.duration)}
                          onEnded={() => setVoicePreviewPlaying(false)}
                          onPlay={() => { 
                            document.querySelectorAll('audio, video').forEach(el => { if (el !== voicePreviewRef.current) el.pause(); }); 
                            setVoicePreviewPlaying(true); 
                          }}
                          onPause={() => setVoicePreviewPlaying(false)}
                        />

                        {/* Top Row: Time, Waveform, Speed */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ color: "var(--ma-text, #000)", fontSize: "13px", fontWeight: "bold", minWidth: "32px" }}>
                            {formatVoiceTime(voicePreviewProgress)}
                          </span>

                          {/* Fake Waveform */}
                          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2px", height: "24px" }}>
                            {Array.from({ length: 40 }).map((_, i) => {
                              const isActive = (voicePreviewProgress / (voicePreviewDuration || 1)) > (i / 40);
                              const height = 6 + (Math.sin(i * 0.5) * 6) + (i % 3 === 0 ? 6 : 0);
                              return <div key={i} style={{ width: "2px", height: `${Math.max(4, height)}px`, borderRadius: "1px", background: isActive ? "#ff365f" : "var(--ma-border, #e5e5e5)" }} />;
                            })}
                          </div>

                          <button type="button" onClick={() => {
                            const speeds = [1, 1.5, 2];
                            const nextSpeed = speeds[(speeds.indexOf(voicePreviewSpeed) + 1) % speeds.length];
                            setVoicePreviewSpeed(nextSpeed);
                            if (voicePreviewRef.current) voicePreviewRef.current.playbackRate = nextSpeed;
                          }} style={{ background: "transparent", border: "1px dashed var(--ma-border, #e5e5e5)", borderRadius: "50%", color: "var(--ma-text, #000)", width: "26px", height: "26px", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>
                            {voicePreviewSpeed}x
                          </button>
                        </div>

                        {/* Bottom Row: Trash, Pause/Resume, Send */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button type="button" onClick={() => { setCommentAudio(null); setCommentAudioUrl(null); setVoicePreviewPlaying(false); setVoicePreviewProgress(0); }} style={{ background: "rgba(255, 54, 95, 0.1)", border: 0, borderRadius: "50%", width: "40px", height: "40px", display: "grid", placeItems: "center", color: "#ff365f", cursor: "pointer", flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                          </button>

                          <button type="button" onClick={() => {
                            if (voicePreviewRef.current.paused) voicePreviewRef.current.play();
                            else voicePreviewRef.current.pause();
                          }} style={{ flex: 1, background: "var(--ma-surface, #f0f0f0)", border: 0, borderRadius: "24px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--ma-text, #000)", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>mic</span>
                            {voicePreviewPlaying ? "Pause" : "Resume"}
                          </button>

                          <button type="submit" disabled={isPostingComment} style={{ background: "#ff365f", border: 0, borderRadius: "50%", width: "40px", height: "40px", display: "grid", placeItems: "center", color: "#ffffff", cursor: isPostingComment ? "not-allowed" : "pointer", flexShrink: 0, opacity: isPostingComment ? 0.5 : 1 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>send</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="premium-comment-input-wrap" style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--ma-surface, #f0f0f0)", borderRadius: "24px", padding: "4px 12px", border: "1px solid var(--ma-border, #e5e5e5)" }}>
                      
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", padding: 0, display: "flex", cursor: "pointer" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>sentiment_satisfied</span>
                      </button>

                      <input 
                        value={newComment} 
                        onChange={e => setNewComment(e.target.value)} 
                        placeholder="Add a comment..." 
                        style={{ flex: 1, padding: "10px", background: "transparent", border: 0, color: "var(--ma-text)", outline: "none", fontSize: "14px" }} 
                      />

                      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "var(--ma-text-secondary, #666)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>image</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setCommentImage(e.target.files[0])} />
                      </label>

                      {isRecording ? (
                        <button type="button" onClick={stopRecording} style={{ background: "#ff365f", borderRadius: "50%", border: 0, width: "32px", height: "32px", display: "grid", placeItems: "center", color: "var(--ma-text)", marginLeft: "8px", cursor: "pointer" }}>
                          <span style={{ fontSize: "12px", fontWeight: "bold" }}>{recordingTime}s</span>
                        </button>
                      ) : (
                        <button type="button" onClick={startRecording} style={{ background: "transparent", border: 0, color: "var(--ma-text-secondary, #666)", display: "flex", cursor: "pointer", padding: 0, marginLeft: "8px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>mic</span>
                        </button>
                      )}
                    </div>
                    
                    <button type="submit" style={{ background: newComment.trim() ? "#3ea6ff" : "#212121", border: 0, borderRadius: "50%", width: "44px", height: "44px", display: "grid", placeItems: "center", color: newComment.trim() ? "#0f0f0f" : "#555", transition: "background 0.2s", cursor: "pointer" }}>
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                )}
              </form>

              {showEmojiPicker && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", background: "var(--ma-surface)", padding: "10px", borderRadius: "10px", maxHeight: "100px", overflowY: "auto" }}>
                  {["😀", "😂", "❤️", "🔥", "👍", "🙏", "🎉", "😍", "😭", "🤔", "👏", "💯", "🥰", "😎"].map(emoji => (
                    <button type="button" key={emoji} onClick={() => { setNewComment(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ background: "transparent", border: 0, fontSize: "24px", cursor: "pointer" }}>{emoji}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
