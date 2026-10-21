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