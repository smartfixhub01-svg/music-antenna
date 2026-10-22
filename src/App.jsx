import { useEffect, useRef, useState } from "react";

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
import { supabase } from "./lib/supabase";
import "./App.css";

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
  const [resetEmail, setResetEmail] = useState("");
  const [theme, setTheme] = useState("device");

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
  const [feedLoading, setFeedLoading] = useState(false);
  const [search, setSearch] = useState("");
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
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    // Keep it inside the screen bounds
    let newLeft = dragRef.current.initialLeft + dx;
    let newTop = dragRef.current.initialTop + dy;
    newLeft = Math.max(8, Math.min(window.innerWidth - 140, newLeft));
    newTop = Math.max(8, Math.min(window.innerHeight - 140, newTop));
    
    setMiniPlayerPos({ left: newLeft, top: newTop });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({ totalViews: 0, totalSubs: 0, totalComments: 0, weeklyViews: 0, weeklySubs: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [mySubCount, setMySubCount] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showManagePage, setShowManagePage] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [showAllPlaylists, setShowAllPlaylists] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const [showLikedPage, setShowLikedPage] = useState(false);
  const [likedMedia, setLikedMedia] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);

  const [manageMedia, setManageMedia] = useState([]);
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
    }
  }, [showSubscriptionsFeed, subsTab, session?.user?.id]);

  // Reload feed when Subscriptions is toggled
  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSubscriptionsFeed, category]);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isShortUpload, setIsShortUpload] = useState(false);

  const viewCountedRef = useRef(false);
  const [uploadTitle, setUploadTitle] = useState("");
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
  const [replyingToName, setReplyingToName] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [channelProfile, setChannelProfile] = useState(null);
  const [channelMedia, setChannelMedia] = useState([]);
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
    setShowAnalytics(false);
    setShowAccountPage(false);
    setShowChannelPage(false);
    setActiveMedia(item);
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
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
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
              role: ["artist", "listener"].includes(user.user_metadata?.account_type)
                ? user.user_metadata.account_type
                : "listener",
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
    if (!session?.user?.id || session.user.id === targetUserId) return;
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      actor_id: session.user.id,
      type: type,
      media_id: mediaId
    });
  }

  
  async function handleForgotPassword() {
    setShowResetModal(true);
  }

  async function submitPasswordReset() {
    if (!resetEmail) return setMessage("Please enter an email address.");
    setMessage("Sending reset link...");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/update-password',
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

        setMessage("Welcome back to !");
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

  async function fetchPlaylists() {
    if (!session?.user?.id) return;
    const { data } = await supabase.from("playlists").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    setPlaylists(data || []);
  }


  async function openPlaylist(pl) {
    setSelectedPlaylist(pl);
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
        return { ...item, media: { ...m, playbackUrl: pub?.signedUrl || "", thumbnailUrl } };
      }));
      setPlaylistItems(itemsWithUrls);
    } catch (err) {
      setMessage("Error loading playlist: " + err.message);
    } finally {
      setPlaylistLoading(false);
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
  }

  async function removeFromPlaylist(itemId) {
    try {
      await supabase.from("playlist_items").delete().eq("id", itemId);
      setPlaylistItems(prev => prev.filter(i => i.id !== itemId));
      setMessage("Removed from playlist.");
    } catch (err) { setMessage("Error: " + err.message); }
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
  }

  async function addToPlaylist(playlistId) {
    try {
      const { error } = await supabase.from("playlist_items").insert({ playlist_id: playlistId, media_id: activeMedia.id });
      if (error && error.code !== "23505") throw error; 
      setMessage(error ? "Video is already in this playlist." : "Added to playlist!");
      setShowPlaylistModal(false);
    } catch (err) { setMessage("Error: " + err.message); }
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

  async function openManagePage() {
    if (!session?.user?.id) return;
    setShowManagePage(true);
    setShowAccountPage(false);
    setShowChannelPage(false);
    setActiveMedia(null);
    setManageLoading(true);
    
    const localMedia = media.filter(m => m.artist_id === session.user.id);
    if (localMedia.length > 0) setManageMedia(localMedia);

    try {
      const { data, error } = await supabase.from("media").select("*").eq("artist_id", session.user.id).order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setManageMedia(data);
      }
    } catch (err) {
      console.error("Manage page error:", err);
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
      openManagePage(); // Refresh list
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
      openManagePage();
      loadMedia();
    } catch (err) {
      setMessage("Error deleting: " + err.message);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      setMessage("Error deleting comment: " + err.message);
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
    try {
      await supabase.from("comments").update({ has_creator_heart: !currentHeart }).eq("id", commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, has_creator_heart: !currentHeart } : c));
    } catch (err) { setMessage(err.message); }
  }

  async function handleLikeComment(commentId, currentLikes) {
    try {
      await supabase.from("comments").update({ likes: currentLikes + 1 }).eq("id", commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c));
    } catch (err) { setMessage(err.message); }
  }

  async function handleUpdateComment(commentId) {
    if (!editCommentText.trim()) return;
    try {
      await supabase.from("comments").update({ content: editCommentText }).eq("id", commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentText } : c));
      setEditingCommentId(null);
    } catch (err) { setMessage(err.message); }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await supabase.from("comments").delete().eq("id", commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) { setMessage(err.message); }
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
    if (!session?.user?.id) return setMessage("Sign in to comment.");
    if (!newComment.trim() && !commentImage && !commentAudio) return;
    
    setMessage("Posting comment...");
    let imageUrl = null;
    let audioUrl = null;

    try {
      // Upload Image if exists
      if (commentImage) {
        const safeName = commentImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = session.user.id + "/" + Date.now() + "-img-" + safeName;
        const { error: imgErr } = await supabase.storage.from("comment-media").upload(path, commentImage);
        if (imgErr) throw imgErr;
        imageUrl = supabase.storage.from("comment-media").getPublicUrl(path).data.publicUrl;
      }

      // Upload Audio if exists
      if (commentAudio) {
        const path = session.user.id + "/" + Date.now() + "-voice.webm";
        const { error: audErr } = await supabase.storage.from("comment-media").upload(path, commentAudio);
        if (audErr) throw audErr;
        audioUrl = supabase.storage.from("comment-media").getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase.from("comments").insert({
        media_id: activeMedia.id, 
        user_id: session.user.id, 
        content: newComment.trim(),
        parent_id: replyTarget ? replyTarget : null,
        image_url: imageUrl,
        audio_url: audioUrl
      }).select("*, profiles(display_name, avatar_url)").single();
      
      if (error) throw error;
      
      setComments(prev => [data, ...prev]);
      setNewComment("");
      setCommentImage(null);
      setCommentAudio(null); setCommentAudioUrl(null); setVoicePreviewPlaying(false); setVoicePreviewProgress(0);
      setReplyTarget(null);
      setReplyingName("");
      setMessage("Comment posted!");
      
      
    } catch (err) { setMessage("Error: " + err.message); }
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
    try {
      if (isSubscribed) {
        const { error } = await supabase.from("subscriptions").delete().eq("channel_id", channelId).eq("subscriber_id", session.user.id);
        if (error) throw error;
        setSubscriberCount(prev => Math.max(0, prev - 1));
        setIsSubscribed(false);
      } else {
        const { error } = await supabase.from("subscriptions").insert({ channel_id: channelId, subscriber_id: session.user.id });
        createNotification(channelId, "subscribe");
        if (error) throw error;
        setSubscriberCount(prev => prev + 1);
        setIsSubscribed(true);
      }
    } catch (err) { setMessage("Sub Error: " + err.message); }
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
      <main className="auth-page">
        <section className="auth-card">
          <img src="/music-antenna-logo.png" alt="Music Antenna" style={{ width: "100%", maxWidth: "180px", height: "auto", objectFit: "contain", margin: "0 auto 16px" }} />
          <h1></h1>
          <p>Connecting securely...</p>
        </section>
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
                      onClick={handleForgotPassword}
                    >
                      Reset password
                    </button>
                  
      {showMoreOptions && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", alignItems: "flex-end" }} onClick={() => setShowMoreOptions(false)}>
          <div style={{ background: "#212121", width: "100%", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", padding: "20px", paddingBottom: "40px" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ width: "40px", height: "4px", background: "#555", borderRadius: "2px", margin: "0 auto 20px" }}></div>
            
            <h3 style={{ color: "#fff", margin: "0 0 20px 0", fontSize: "18px" }}>Video Options</h3>
            
            {/* Playback Speed */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "8px" }}>Playback Speed</p>
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 1.5, 2].map(speed => (
                  <button key={speed} onClick={() => {
                    if (videoRef.current) videoRef.current.playbackRate = speed;
                    if (audioRef.current) audioRef.current.playbackRate = speed;
                    setMessage(`Speed set to ${speed}x`);
                    setShowMoreOptions(false);
                  }} style={{ flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button onClick={() => { handleShare(activeMedia); setShowMoreOptions(false); }} style={{ width: "100%", padding: "16px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", marginBottom: "10px", textAlign: "left", fontSize: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              🔗 Copy / Share Link
            </button>
            
            <button onClick={() => { setMessage("Video reported. Thank you."); setShowMoreOptions(false); }} style={{ width: "100%", padding: "16px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", marginBottom: "10px", textAlign: "left", fontSize: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              ⚠️ Report Video
            </button>
            
            <button onClick={() => setShowMoreOptions(false)} style={{ width: "100%", padding: "16px", background: "transparent", color: "#ff365f", border: "1px solid #ff365f", borderRadius: "8px", marginTop: "10px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>
              Cancel
            </button>
            
          </div>
        </div>
      )}

    
      

    
      {showResetModal && (
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
                      onClick={handleForgotPassword}
                    >
                      Reset Art ID
                    </button>
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

          {message && (
            <p className="auth-screen-message" role="status">{message}</p>
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
    if (!viewCountedRef.current && activeMedia?.id) {
      // 1. Don't count if the creator is watching their own video
      if (session?.user?.id === activeMedia.artist_id) return;

      // 2. Don't count if this user already viewed it (stored locally)
      const viewedKey = `viewed_${activeMedia.id}`;
      if (localStorage.getItem(viewedKey)) return;

      viewCountedRef.current = true;
      localStorage.setItem(viewedKey, "true");

      // 3. Increment the main counter on the media table
      supabase.rpc("increment_view", { media_id: activeMedia.id }).then(() => {
        setMedia(prev => prev.map(m => m.id === activeMedia.id ? { ...m, views: (m.views || 0) + 1 } : m));
      });

      // 4. Log the view in the new table for analytics
      supabase.from("video_views").insert({ media_id: activeMedia.id, user_id: session?.user?.id || null }).then(() => {});
    }
  }

  function formatVoiceTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return (
    <div className="ma-app">
        {/* PERMANENT AUDIO PLAYER (Never stops on tab change) */}
        
      <header className="ma-header">
        <div className="ma-brand" style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: "4px" }} onClick={() => { closeAllOverlays(); setCategory("All"); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <img src="/music-antenna-logo.png" alt="" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
            </div>

        <div className="ma-search">
          <div className="ma-search-box" style={{ display: "flex", alignItems: "center" }}>
            <input aria-label="Search" placeholder="Search" value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
            {searchLoading && (
              <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite", fontSize: "18px", color: "var(--ma-accent)", marginRight: "12px", flexShrink: 0 }}>
                sync
              </span>
            )}
            {search && (
              <button className="ma-search-clear" onClick={() => setSearch("")} aria-label="Clear">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          <button className="ma-search-btn" aria-label="Search">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="ma-mic-btn" aria-label="Voice search">
            <span className="material-symbols-outlined">mic</span>
          </button>
        </div>

        <div className="ma-user">
          <div style={{ position: "relative" }}>
            <button className="ma-icon-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className="yt-nav-badge" style={{ position: "absolute", top: 4, right: 4, background: "red", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "10px", fontWeight: "bold" }}>{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="yt-notif-dropdown" style={{ position: "absolute", top: "100%", right: 0, width: "300px", background: "#212121", borderRadius: "12px", padding: "16px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", color: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={async () => {
                      await supabase.from("notifications").delete().eq("user_id", session.user.id);
                      setNotifications([]);
                      setUnreadCount(0);
                    }} style={{ background: "transparent", border: "none", color: "#ff365f", fontSize: "12px", cursor: "pointer" }}>Clear All</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>You're all caught up.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ display: "flex", gap: "10px", marginBottom: "12px", borderBottom: "1px solid #333", paddingBottom: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ff365f", display: "grid", placeItems: "center", overflow: "hidden" }}>
                        {n.actor?.avatar_url ? <img src={n.actor.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : "♫"}
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        <strong>@{n.actor?.display_name || "User"}</strong> {n.type} your {n.type === 'subscribe' ? 'channel' : 'video'}.
                        <br/><span style={{color: "#aaa", fontSize: "10px"}}>{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                <div className="ma-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="ma-avatar-menu" role="menu">
                  <div className="ma-avatar-menu-header">
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
                  <button onClick={() => { setShowAnalytics(false);  setMenuOpen(false); setShowAccountPage(true); setShowProfileEditor(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
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
<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "#0f0f0f", overflowY: "auto" }}>

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

              <form className="yt-upload-form" onSubmit={handleUpload}>
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

              <div className="ma-empty">
                <span className="ma-spinner">♫</span>
                <h3>Loading your feed...</h3>
                <p>Fetching published media from Supabase.</p>
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
                        <img src={item.thumbnailUrl} alt="" loading="lazy" />
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
                      <div 
                        className="yt-video-avatar" 
                        onClick={(e) => { e.stopPropagation(); openChannel(item.artist_id); }}
                        style={{ cursor: "pointer" }}
                      >
                        {item.profiles?.avatar_url ? (
                          <img src={item.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : "♫"}
                      </div>
                      <div className="yt-video-info">
                        <h3 className="yt-video-title">{item.title}</h3>
                        <p 
                          className="yt-video-channel" 
                          onClick={(e) => { e.stopPropagation(); openChannel(item.artist_id); }}
                          style={{ cursor: "pointer" }}
                        >
                          {item.profiles?.display_name || "Unknown Artist"}
                        </p>
                        <p className="yt-video-meta">
                          {item.views || 0} views • {timeAgo(item.created_at)}
                        </p>
                      </div>
                      <button className="yt-video-menu" aria-label="More">⋮</button>
                    </div>
                  </article>
                ))}
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
              <button className="yt-icon-btn" aria-label="More" onClick={() => setShowMoreMenu(true)}>
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>

          <div className="yt-watch-player">
            
            {activeMedia.playbackUrl ? (
              activeMedia.media_type === "video" ? (
                <video
                  onPlay={handleFirstPlay}
                  className="yt-watch-video"
                  src={activeMedia.playbackUrl}
                  poster={activeMedia.thumbnailUrl || undefined}
                  controls
                  playsInline
                  autoPlay
                />
              ) : (
                <div className="yt-watch-audio">
                  <div className="yt-watch-audio-art">
                    {activeMedia.thumbnailUrl ? (
                      <img src={activeMedia.thumbnailUrl} alt="" />
                    ) : (
                      <img src="/logo.png" alt="" style={{ height: "36px", width: "auto", objectFit: "contain", borderRadius: "6px" }} />
                    )}
                  </div>
                  <audio src={activeMedia.playbackUrl} controls autoPlay onPlay={handleFirstPlay} />
                </div>
              )
            ) : (
              <p className="yt-watch-error">This item's playback URL is missing.</p>
            )}
          </div>

          <div className="yt-watch-body">
            <h1 className="yt-watch-title">{activeMedia.title}</h1>
            <p className="yt-watch-meta">
              @{watchArtist?.username || watchArtist?.display_name || "music-antenna"}
              {" · "}{activeMedia.views || 0} views
              {" · "}{new Date(activeMedia.created_at).toLocaleDateString()}
            </p>

            <div className="yt-watch-actions">
              <button className="yt-watch-action" onClick={(e) => { e.stopPropagation(); handleToggleLike(activeMedia.id); }}>
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
                <a href={activeMedia.playbackUrl} download={activeMedia.title} target="_blank" rel="noopener noreferrer" className="yt-watch-action" style={{ textDecoration: "none", color: "#f1f1f1" }}>
                  <span className="material-symbols-outlined">download</span>
                  <span className="yt-watch-action-label">Download</span>
                </a>
              )}

              <button className="yt-watch-action" onClick={(e) => { e.stopPropagation(); fetchPlaylists(); setShowPlaylistModal(true); }}>
                <span className="material-symbols-outlined">playlist_add</span>
                <span className="yt-watch-action-label">Save</span>
              </button>
              
              <button className="yt-watch-action" onClick={() => setShowMoreMenu(true)}>
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            <div className="yt-watch-channel">
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
                <button className="yt-watch-subscribe" onClick={() => { setActiveMedia(null); setShowWatchPage(false); openManagePage(); }}>
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

            <div className="yt-watch-desc">
              <p className="yt-watch-desc-text">
                {activeMedia.description || "No description yet."}
              </p>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); }}
              style={{ width: "100%", padding: "12px 16px", background: "#212121", borderRadius: "12px", color: "#f1f1f1", marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "14px" }}>Comments <span style={{ color: "#aaa" }}>{comments.length}</span></span>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>expand_more</span>
              </div>
              
              {comments.length > 0 && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div className="yt-video-avatar" style={{ width: "28px", height: "28px" }}>
                    {comments[0].profiles?.avatar_url ? <img src={comments[0].profiles.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : "♫"}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#f1f1f1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {comments[0].content}
                  </p>
                </div>
              )}
            </div>

            
          </div>
        </section>
      )}

      {showAccountPage && (
        <section className="yt-you" style={{ padding: "0 0 100px", background: "#0f0f0f", minHeight: "100vh" }}>
          
          {/* 1. BANNER */}
          <div style={{ width: "100%", height: "120px", background: "linear-gradient(135deg, #2a1622, #121722, #ff365f)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "url('https://wcuqehdequrealcndkyw.supabase.co/storage/v1/object/public/track-covers/logo.png') center/cover", opacity: 0.15 }}></div>
          </div>

          {/* 2. PROFILE HEADER (Overlapping the banner) */}
          <div style={{ padding: "0 16px", marginTop: "-44px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
              
              {/* Avatar */}
              <div style={{ width: "88px", height: "88px", borderRadius: "50%", border: "4px solid #0f0f0f", background: "#ff365f", overflow: "hidden", flexShrink: 0 }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "32px", fontWeight: "bold", color: "white", display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>{(profile?.display_name || displayUser || "M").charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Name & Bio */}
              <div style={{ paddingBottom: "4px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#f1f1f1", display: "flex", alignItems: "center", gap: "4px" }}>
                  {profile?.display_name || displayUser || "Music listener"}
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--ma-accent)", fontVariationSettings: "'FILL' 1" }}>verified</span>
                </h2>
                <p style={{ margin: "2px 0", fontSize: "13px", color: "#aaa" }}>@{profile?.username || profile?.display_name || "music-antenna-user"}</p>
                <p style={{ margin: "2px 0", fontSize: "13px", color: "#aaa" }}>{profile?.bio || "Shadow Boss"}</p>
              </div>
            </div>
            
            <p style={{ margin: "8px 0 16px", fontSize: "12px", color: "#ff365f", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>verified</span> Verified Artist
            </p>

            {/* 3. STATS ROW */}
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #212121", marginBottom: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#f1f1f1" }}>{media.filter(m => m.artist_id === session?.user?.id).length}</div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>Uploads</div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "#303030" }}></div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#f1f1f1" }}>{media.filter(m => m.artist_id === session?.user?.id).reduce((sum, m) => sum + (m.views || 0), 0)}</div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>Views</div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "#303030" }}></div>
              <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => { 
                if (session?.user?.id) {
                  supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", session.user.id).then(({ count }) => setMySubCount(count || 0));
                  setMessage("Refreshed subscriber count!");
                  
                }
              }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#f1f1f1" }}>{mySubCount}</div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>Subscribers</div>
              </div>
            </div>

            {/* 4. ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <button onClick={() => { setShowAccountPage(false); openChannel(session?.user?.id); }} style={{ flex: 1, background: "#ff365f", color: "#fff", padding: "10px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", border: 0 }}>
                View channel
              </button>
              <button onClick={() => { setProfileName(profile?.username || ""); setProfileBio(profile?.bio || ""); setShowProfileEditor(!showProfileEditor); }} style={{ flex: 1, background: "#212121", color: "#f1f1f1", padding: "10px", borderRadius: "8px", fontWeight: "500", fontSize: "14px", border: 0, cursor: "pointer" }}>
                {showProfileEditor ? "Close Editor" : "Edit profile"}
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(activeMedia); }} style={{ background: "#212121", color: "#f1f1f1", width: "40px", height: "40px", borderRadius: "8px", display: "grid", placeItems: "center", border: 0, cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>share</span>
              </button>
            </div>

            {/* 5. TABS */}
            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #303030", marginBottom: "16px" }}>
              <button style={{ background: "transparent", border: 0, paddingBottom: "8px", color: "#ff365f", fontWeight: "600", fontSize: "14px", borderBottom: "2px solid #ff365f" }}>Overview</button>
              <button onClick={() => { setShowAccountPage(false); setShowManagePage(true); }} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: "#aaa", fontWeight: "500", fontSize: "14px", cursor: "pointer" }}>Content</button>
              <button onClick={openAnalytics} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: "#aaa", fontWeight: "500", fontSize: "14px", cursor: "pointer" }}>Analytics</button>
              <button onClick={() => setMessage("About section coming soon.")} style={{ background: "transparent", border: 0, paddingBottom: "8px", color: "#aaa", fontWeight: "500", fontSize: "14px", cursor: "pointer" }}>About</button>
            </div>

            {/* 6. CREATOR DASHBOARD CARD */}
            {profile?.role === "artist" && (
              <div style={{ background: "#181818", borderRadius: "12px", padding: "16px", border: "1px solid #303030", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#f1f1f1" }}>Creator dashboard</h3>
                  <span className="material-symbols-outlined" onClick={openAnalytics} style={{ color: "#ff365f", fontSize: "20px", cursor: "pointer" }}>bar_chart</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ background: "#212121", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", background: "rgba(255,54,95,0.1)", padding: "6px", borderRadius: "50%", fontSize: "18px", marginBottom: "8px", display: "inline-block" }}>upload</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#f1f1f1" }}>{media.filter(m => m.artist_id === session?.user?.id).length}</div>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>Uploads</div>
                  </div>
                  <div style={{ background: "#212121", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", background: "rgba(255,54,95,0.1)", padding: "6px", borderRadius: "50%", fontSize: "18px", marginBottom: "8px", display: "inline-block" }}>visibility</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#f1f1f1" }}>{media.filter(m => m.artist_id === session?.user?.id).reduce((sum, m) => sum + (m.views || 0), 0)}</div>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>Views</div>
                  </div>
                  <div style={{ background: "#212121", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ color: "#ff365f", background: "rgba(255,54,95,0.1)", padding: "6px", borderRadius: "50%", fontSize: "18px", marginBottom: "8px", display: "inline-block" }}>group</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#f1f1f1" }}>{mySubCount}</div>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>Subscribers</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <button onClick={() => { setShowAccountPage(false); setShowUpload(true); }} style={{ background: "#272727", color: "white", border: 0, padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>upload</span> Upload
                  </button>
                  <button onClick={() => { setShowAccountPage(false); setShowManagePage(true); }} style={{ background: "#272727", color: "white", border: 0, padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>format_list_bulleted</span> Manage
                  </button>
                  <button onClick={openAnalytics} style={{ background: "#272727", color: "white", border: 0, padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>bar_chart</span> Analytics
                  </button>
                </div>
              </div>
            )}
            
            {/* HISTORY */}
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "600", color: "#f1f1f1" }}>History</h3>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px", marginBottom: "16px" }}>
               {history.slice(0, 4).map((item) => (
                  <div key={item.id} onClick={() => { const found = media.find(m => m.id === item.id); if (found) openPlayer(found); }} style={{ flexShrink: 0, width: "140px", cursor: "pointer" }}>
                    <div style={{ width: "140px", height: "80px", background: "#212121", borderRadius: "8px", overflow: "hidden", marginBottom: "6px" }}>
                      {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#aaa" }}><span className="material-symbols-outlined">movie</span></div>}
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#f1f1f1", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                  </div>
                ))}
            </div>

            {/* EDIT PROFILE FORM */}
            {showProfileEditor && (
              <section style={{ background: "#212121", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px" }}>Edit Profile</h3>
                <form onSubmit={handleSaveProfile}>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#121212", color: "white", border: "1px solid #333", marginBottom: "12px" }} />
                  <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#121212", color: "white", border: "1px solid #333", marginBottom: "12px" }} />
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#ff365f", color: "white", border: 0, borderRadius: "8px", fontWeight: "bold" }}>Save changes</button>
                </form>
              </section>
            )}

          </div>
        </section>
      )}

            {showChannelPage && (
        <section className="yt-channel">
          <div className="yt-channel-topbar">
            <button
              className="yt-icon-btn"
              aria-label="Back"
              onClick={() => {
                setShowChannelPage(false);
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
                <span className="material-symbols-outlined" style={{ cursor: "pointer" }} onClick={() => setMessage("More options coming soon!")}>more_vert</span>
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
                  <p className="yt-channel-subscribers">{subscriberCount} subscribers</p>
                  <p className="yt-channel-bio">
                    {channelProfile.bio || "Welcome to my  channel."}
                  </p>
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
                        openManagePage();
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

              {channelMedia.length > 0 ? (
                <div className="ma-media-grid">
                  {channelMedia.map((item) => (
                    <article className="yt-video" key={item.id}>
                      <button
                        className="yt-thumb"
                        onClick={() => openPlayer(item)}
                        aria-label={"Play " + item.title}
                      >
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" loading="lazy" />
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
                        <div className="yt-video-avatar">♫</div>
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
              ) : (
                <p className="yt-you-empty">This artist hasn't uploaded anything yet.</p>
              )}
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
        <section style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: "56px", background: "#0f0f0f", zIndex: 9999, overflowY: "auto", padding: "16px", color: "#f1f1f1", fontFamily: "Roboto, sans-serif" }}>
          
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "12px" }}>
            <button onClick={() => { setShowAnalytics(false); setShowAccountPage(true); }} style={{ background: "transparent", border: 0, color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>arrow_back</span>
            </button>
            <h2 style={{ margin: "0 0 0 16px", fontSize: "18px" }}>Channel Analytics</h2>
          </div>

          {analyticsLoading ? (
            <p style={{ textAlign: "center", marginTop: "40px", color: "#aaa" }}>Loading data...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ background: "#212121", padding: "16px", borderRadius: "12px", border: "1px solid #333" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#f1f1f1" }}>Overview</h3>
                <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, color: "var(--ma-accent)", fontSize: "24px" }}>{analyticsData.totalViews}</h2>
                    <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>Views</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, color: "#ff365f", fontSize: "24px" }}>{analyticsData.totalSubs}</h2>
                    <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>Subs</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, color: "#aaa", fontSize: "24px" }}>{analyticsData.totalComments}</h2>
                    <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>Comments</p>
                  </div>
                </div>
              </div>

              <div style={{ background: "#212121", padding: "16px", borderRadius: "12px", border: "1px solid #333" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#f1f1f1" }}>Last 7 Days</h3>
                <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "var(--ma-accent)", fontSize: "24px" }}>+{analyticsData.weeklyViews}</h2>
                    <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>New Views</p>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: "#ff365f", fontSize: "24px" }}>+{analyticsData.weeklySubs}</h2>
                    <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>New Subs</p>
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
            <button className="yt-icon-btn" onClick={() => { setShowManagePage(false); setEditingMedia(null); setShowAccountPage(true); }}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 style={{ fontSize: "18px", margin: 0 }}>Manage Uploads</h2>
            <div style={{ width: "40px" }}></div>
          </div>

          {editingMedia ? (
            <form className="yt-upload-form" style={{ padding: "0 16px", marginTop: "16px" }} onSubmit={handleUpdateVideo}>
              <h3 style={{ marginBottom: "16px" }}>Edit details</h3>
              
              <label className="yt-upload-field">
                <span>Title</span>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
              </label>
              
              <label className="yt-upload-field">
                <span>Description</span>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} />
              </label>

              <div className="yt-upload-field">
                <span>Thumbnail</span>
                <label className="yt-upload-thumb">
                  <input type="file" accept="image/*" onChange={e => setEditThumbnailFile(e.target.files?.[0] || null)} />
                  <span className="material-symbols-outlined">image</span>
                  <span>{editThumbnailFile ? editThumbnailFile.name : "Upload new thumbnail"}</span>
                </label>
              </div>

              <label className="yt-upload-field">
                <span>Visibility</span>
                <select value={editVisibility} onChange={e => setEditVisibility(e.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </label>

              <label className="ma-checkbox yt-upload-checkbox">
                <input type="checkbox" checked={editAllowDownload} onChange={e => setEditAllowDownload(e.target.checked)} />
                Allow downloads
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="yt-upload-cancel" onClick={() => setEditingMedia(null)}>Cancel</button>
                <button type="submit" className="yt-upload-submit" disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>

              <button type="button" onClick={() => handleDeleteVideo(editingMedia.id, editingMedia.storage_path, editingMedia.thumbnail_path)}
                style={{ background: "transparent", border: "1px solid red", color: "red", padding: "10px", borderRadius: "20px", width: "100%", marginTop: "30px", cursor: "pointer", fontWeight: "bold" }}>
                Delete Video Permanently
              </button>
            </form>
          ) : (
            <div className="yt-manage-list">
              {manageLoading ? (
                <p style={{ padding: "20px", color: "#aaa" }}>Loading uploads...</p>
              ) : manageMedia.length === 0 ? (
                <p style={{ padding: "20px", color: "#aaa" }}>You haven't uploaded anything yet.</p>
              ) : (
                manageMedia.map(item => (
                  <div key={item.id} className="yt-manage-item">
                    <div className="yt-manage-thumb">
                      {item.thumbnail_path ? (
                        <img src={supabase.storage.from("track-covers").getPublicUrl(item.thumbnail_path).data.publicUrl} alt="" />
                      ) : (
                        <div style={{ background: "#303030", display: "grid", placeItems: "center", height: "100%", color: "#aaa" }}>
                          <span className="material-symbols-outlined">movie</span>
                        </div>
                      )}
                    </div>
                    <div className="yt-manage-details">
                      <h4>{item.title}</h4>
                      <p>{item.visibility || "public"} • {item.media_type}</p>
                    </div>
                    <button type="button" className="yt-manage-edit-btn" onClick={() => startEditingVideo(item)}>
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {activeMedia && !showWatchPage && (
        <div 
          className={"yt-mini-player" + (navVisible || isDragging || miniPlayerPos ? "" : " yt-mini-hidden") + (isDragging ? " yt-mini-dragging" : "")}
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
              <img src={activeMedia.thumbnailUrl} alt="" style={{ pointerEvents: "none" }} />
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
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setActiveMedia(null); 
                setShowWatchPage(false);
                setMiniPlayerPos(null); // Reset position when closed
                if (audioRef.current) audioRef.current.pause(); 
                if (videoRef.current) videoRef.current.pause(); 
              }} 
              className="yt-mini-close-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px", pointerEvents: "none" }}>close</span>
            </button>
          </div>

        </div>
      )}

    
      
      
      
      
      {showSubscriptionsPage && (
        <section style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--ma-bg-primary)", overflowY: "auto", paddingBottom: "80px", color: "var(--ma-text-primary)", fontFamily: "Roboto, sans-serif" }}>
          
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: "var(--ma-bg-primary)", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid var(--ma-border)" }}>
            <button onClick={() => setShowSubscriptionsPage(false)} style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer", display: "flex", padding: "8px", marginRight: "8px" }}>
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
                        <button onClick={() => { setShowSubscriptionsPage(false); setCategory("All"); }} style={{ background: "#FF0033", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
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
      {showPlaylistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#212121", width: "90%", maxWidth: "400px", borderRadius: "12px", padding: "20px", color: "#f1f1f1", fontFamily: "Roboto, sans-serif", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Save to playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: "transparent", border: 0, color: "#aaa", cursor: "pointer", display: "flex" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreatePlaylist} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input 
                type="text" 
                placeholder="New playlist name..." 
                value={newPlaylistName} 
                onChange={e => setNewPlaylistName(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #444", background: "#121212", color: "white", outline: "none" }}
              />
              <button type="submit" style={{ padding: "10px 16px", borderRadius: "8px", background: "#3ea6ff", color: "#0f0f0f", border: 0, fontWeight: "bold", cursor: "pointer" }}>Create</button>
            </form>

            <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {playlists.length === 0 ? (
                <p style={{ color: "#aaa", fontSize: "14px", textAlign: "center", margin: "20px 0" }}>No playlists yet. Create one above.</p>
              ) : (
                playlists.map(pl => (
                  <button key={pl.id} onClick={() => addToPlaylist(pl.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "white", cursor: "pointer", textAlign: "left", fontSize: "14px" }}>
                    <span className="material-symbols-outlined">playlist_play</span>
                    {pl.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL - BULLETPROOF VERSION */}
      {message && (
        <div style={{ position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)", background: "#212121", color: "#fff", padding: "12px 24px", borderRadius: "24px", zIndex: 99999, boxShadow: "0 4px 12px rgba(0,0,0,0.8)", fontWeight: "500", fontSize: "14px", textAlign: "center", border: "1px solid #ff365f" }}>
          {message}
        </div>
      )}


      {showMoreMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", alignItems: "flex-end" }} onClick={() => setShowMoreMenu(false)}>
          <div style={{ background: "#212121", width: "100%", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", padding: "20px", paddingBottom: "40px", color: "white" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ width: "40px", height: "4px", background: "#555", borderRadius: "2px", margin: "0 auto 20px" }}></div>
            
            <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "12px", fontWeight: "bold" }}>Playback Speed</p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              {[1, 1.25, 1.5, 2].map(speed => (
                <button key={speed} onClick={() => {
                  const mediaEl = videoRef.current || audioRef.current;
                  if (mediaEl) {
                    mediaEl.playbackRate = speed;
                    setMessage(`Speed set to ${speed}x`);
                  } else {
                    setMessage("Player is not ready.");
                  }
                  setShowMoreMenu(false);
                }} style={{ flex: 1, padding: "10px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>
                  {speed}x
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { fetchPlaylists(); setShowPlaylistModal(true); setShowMoreMenu(false); }} style={{ padding: "14px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <span className="material-symbols-outlined">playlist_add</span> Save to playlist
              </button>
              
              <button onClick={() => { handleShare(activeMedia); setShowMoreMenu(false); }} style={{ padding: "14px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <span className="material-symbols-outlined">share</span> Share Link
              </button>
              
              <button onClick={() => { setMessage("Video reported. Thank you."); setShowMoreMenu(false); }} style={{ padding: "14px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <span className="material-symbols-outlined">flag</span> Report Video
              </button>
              
              {session?.user?.id === activeMedia?.artist_id && (
                <button onClick={() => { setEditingMedia(activeMedia); setShowWatchPage(false); setShowMoreMenu(false); }} style={{ padding: "14px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                  <span className="material-symbols-outlined">edit</span> Edit Video
                </button>
              )}
            </div>
            
            <button onClick={() => setShowMoreMenu(false)} style={{ width: "100%", padding: "16px", background: "transparent", color: "#fff", border: "none", borderRadius: "8px", marginTop: "10px", fontSize: "15px", cursor: "pointer", fontWeight: "bold" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showCommentsModal && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowCommentsModal(false)}
        >
          <div 
            style={{ background: "#0f0f0f", height: "85vh", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #333" }}>
              <h3 style={{ margin: 0, color: "white", fontSize: "18px" }}>Comments ({comments.length})</h3>
              <button onClick={() => setShowCommentsModal(false)} style={{ background: "transparent", border: 0, color: "white" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "100px" }}>
              {comments.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", marginTop: "40px" }}>No comments yet. Be the first!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start", textAlign: "left" }}>
                    
                    {/* Avatar - Smaller */}
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#ff365f", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", color: "white", fontSize: "12px" }}>
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "♫"}
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                      
                      {/* Name & Time - Compact */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f1f1f1" }}>
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
                          <input value={editCommentText} onChange={e => setEditCommentText(e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #333", background: "#121212", color: "white", fontSize: "13px", marginBottom: "6px" }} />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => setEditingCommentId(null)} style={{ background: "transparent", border: 0, color: "#aaa", fontSize: "11px" }}>Cancel</button>
                            <button onClick={() => handleUpdateComment(c.id)} style={{ background: "#3ea6ff", border: 0, borderRadius: "12px", padding: "2px 10px", color: "#0f0f0f", fontWeight: "bold", fontSize: "11px" }}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: "100%", marginBottom: "4px" }}>
                          {c.content && <p style={{ margin: 0, fontSize: "13px", color: "#f1f1f1", lineHeight: 1.3, wordWrap: "break-word" }}>{c.content}</p>}
                          {c.image_url && <img src={c.image_url} style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "6px", marginTop: "6px" }} />}
                          {c.audio_url && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1f2c34", padding: "8px 12px", borderRadius: "12px", border: "1px solid #2a3942", marginTop: "8px", width: "fit-content" }}>
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
                              style={{ background: "transparent", border: 0, color: "white", cursor: "pointer", display: "flex", padding: 0 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                                {playingCommentId === c.id && !playingCommentRef.current?.paused ? "pause_circle" : "play_circle"}
                              </span>
                            </button>

                            <span style={{ fontSize: "11px", color: "#fff", minWidth: "28px", fontWeight: "bold" }}>
                              {playingCommentId === c.id ? formatVoiceTime(playingCommentProgress) : "0:00"}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "20px", flex: 1 }}>
                              {Array.from({ length: 35 }).map((_, i) => {
                                const isActive = playingCommentId === c.id && (playingCommentProgress / (playingCommentDuration || 1)) > (i / 35);
                                const height = 4 + (Math.sin(i * 0.5) * 4) + (i % 3 === 0 ? 4 : 0);
                                return <div key={i} style={{ width: "2px", height: `${Math.max(3, height)}px`, borderRadius: "1px", background: isActive ? "#00a884" : "#8696a0" }} />;
                              })}
                            </div>

                            <button 
                              onClick={() => {
                                const speeds = [1, 1.5, 2];
                                const nextSpeed = speeds[(speeds.indexOf(playingCommentSpeed) + 1) % speeds.length];
                                setPlayingCommentSpeed(nextSpeed);
                                if (playingCommentRef.current) playingCommentRef.current.playbackRate = nextSpeed;
                              }} 
                              style={{ background: "transparent", border: "1px dashed #8696a0", borderRadius: "50%", color: "#ffffff", width: "24px", height: "24px", display: "grid", placeItems: "center", fontSize: "9px", fontWeight: "bold", cursor: "pointer" }}
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
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", width: "100%", marginTop: "2px" }}>
                          <button onClick={() => handleLikeComment(c.id, c.likes || 0)} style={{ background: "transparent", border: 0, color: "#aaa", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", padding: 0, cursor: "pointer" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>thumb_up</span> {c.likes || 0}
                          </button>
                          
                          <button onClick={() => { setReplyTarget(c.id); setReplyingToName(c.profiles?.display_name || "user"); }} style={{ background: "transparent", border: 0, color: "#aaa", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", padding: 0, cursor: "pointer" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chat_bubble</span> Reply
                          </button>

                          {(session?.user?.id === activeMedia.artist_id) && (
                            <>
                              <button onClick={() => handlePinComment(c.id, c.is_pinned)} style={{ background: "transparent", border: 0, color: c.is_pinned ? "#3ea6ff" : "#aaa", display: "flex", alignItems: "center", padding: 0, cursor: "pointer" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>push_pin</span>
                              </button>
                              <button onClick={() => handleCreatorHeart(c.id, c.has_creator_heart)} style={{ background: "transparent", border: 0, color: c.has_creator_heart ? "#ff365f" : "#aaa", display: "flex", alignItems: "center", padding: 0, cursor: "pointer" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: c.has_creator_heart ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                              </button>
                            </>
                          )}

                          {(session?.user?.id === activeMedia.artist_id || session?.user?.id === c.user_id) && (
                            <>
                              <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} style={{ background: "transparent", border: 0, color: "#aaa", fontSize: "11px", padding: 0, cursor: "pointer", marginLeft: "auto" }}>Edit</button>
                              <button onClick={() => handleDeleteComment(c.id)} style={{ background: "transparent", border: 0, color: "#ff365f", fontSize: "11px", padding: 0, cursor: "pointer" }}>Delete</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#0f0f0f", borderTop: "1px solid #272727", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              
              {replyTarget && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                  <span>Replying to <strong>@{replyingToName}</strong></span>
                  <button onClick={() => { setReplyTarget(null); setReplyingToName(""); }} style={{ background: "transparent", border: 0, color: "var(--ma-accent)", cursor: "pointer" }}>Cancel</button>
                </div>
              )}

              <form onSubmit={handlePostComment} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                
                {(commentImage || commentAudioUrl) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "#1f2c34", borderRadius: "12px", border: "1px solid #2a3942" }}>
                    
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
                          <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: "bold", minWidth: "32px" }}>
                            {formatVoiceTime(voicePreviewProgress)}
                          </span>

                          {/* Fake Waveform */}
                          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2px", height: "24px" }}>
                            {Array.from({ length: 40 }).map((_, i) => {
                              const isActive = (voicePreviewProgress / (voicePreviewDuration || 1)) > (i / 40);
                              const height = 6 + (Math.sin(i * 0.5) * 6) + (i % 3 === 0 ? 6 : 0);
                              return <div key={i} style={{ width: "2px", height: `${Math.max(4, height)}px`, borderRadius: "1px", background: isActive ? "#00a884" : "#8696a0" }} />;
                            })}
                          </div>

                          <button type="button" onClick={() => {
                            const speeds = [1, 1.5, 2];
                            const nextSpeed = speeds[(speeds.indexOf(voicePreviewSpeed) + 1) % speeds.length];
                            setVoicePreviewSpeed(nextSpeed);
                            if (voicePreviewRef.current) voicePreviewRef.current.playbackRate = nextSpeed;
                          }} style={{ background: "transparent", border: "1px dashed #8696a0", borderRadius: "50%", color: "#ffffff", width: "26px", height: "26px", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>
                            {voicePreviewSpeed}x
                          </button>
                        </div>

                        {/* Bottom Row: Trash, Pause/Resume, Send */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button type="button" onClick={() => { setCommentAudio(null); setCommentAudioUrl(null); setVoicePreviewPlaying(false); setVoicePreviewProgress(0); }} style={{ background: "#33161b", border: 0, borderRadius: "50%", width: "40px", height: "40px", display: "grid", placeItems: "center", color: "#ff365f", cursor: "pointer", flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                          </button>

                          <button type="button" onClick={() => {
                            if (voicePreviewRef.current.paused) voicePreviewRef.current.play();
                            else voicePreviewRef.current.pause();
                          }} style={{ flex: 1, background: "#222d34", border: 0, borderRadius: "24px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#ffffff", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>mic</span>
                            {voicePreviewPlaying ? "Pause" : "Resume"}
                          </button>

                          <button type="submit" style={{ background: "#ffffff", border: 0, borderRadius: "50%", width: "40px", height: "40px", display: "grid", placeItems: "center", color: "#00a884", cursor: "pointer", flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>send</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#212121", borderRadius: "24px", padding: "4px 12px", border: "1px solid #333" }}>
                      
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: "transparent", border: 0, color: "#aaa", padding: 0, display: "flex", cursor: "pointer" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>sentiment_satisfied</span>
                      </button>

                      <input 
                        value={newComment} 
                        onChange={e => setNewComment(e.target.value)} 
                        placeholder="Add a comment..." 
                        style={{ flex: 1, padding: "10px", background: "transparent", border: 0, color: "white", outline: "none", fontSize: "14px" }} 
                      />

                      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#aaa" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>image</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setCommentImage(e.target.files[0])} />
                      </label>

                      {isRecording ? (
                        <button type="button" onClick={stopRecording} style={{ background: "#ff365f", borderRadius: "50%", border: 0, width: "32px", height: "32px", display: "grid", placeItems: "center", color: "white", marginLeft: "8px", cursor: "pointer" }}>
                          <span style={{ fontSize: "12px", fontWeight: "bold" }}>{recordingTime}s</span>
                        </button>
                      ) : (
                        <button type="button" onClick={startRecording} style={{ background: "transparent", border: 0, color: "#aaa", display: "flex", cursor: "pointer", padding: 0, marginLeft: "8px" }}>
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", background: "#212121", padding: "10px", borderRadius: "10px", maxHeight: "100px", overflowY: "auto" }}>
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
