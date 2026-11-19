import React from "react";
import { createPortal } from "react-dom";
import "./owner-control-centre.css";

const nav = [
  ["overview","Overview","◫"],["users","User management","♙"],
  ["verification","Artist verification","✓"],["content","Content moderation","▤"],
  ["reports","Reports","⚑"],["analytics","Analytics","▥"],
  ["audit","Audit logs","◷"],["notifications","Notifications","♧"],["settings","Settings","⚙"]
];
const fmt = v => Number(v || 0).toLocaleString();
const when = v => v ? new Date(v).toLocaleString() : "—";

export default function OwnerControlCentre(p) {
  const [menu,setMenu] = React.useState(false);
  const [suspendReason,setSuspendReason] = React.useState("");
  const [search,setSearch] = React.useState(p.adminUsersQuery || "");
  const [contentSearch,setContentSearch] = React.useState("");
  const [contentFilter,setContentFilter] = React.useState("all");
  const [newSettingKey,setNewSettingKey]=React.useState("");
  const [newSettingValue,setNewSettingValue]=React.useState("{}");
  const [editingSettingKey,setEditingSettingKey]=React.useState(null);
  const [editingSettingValue,setEditingSettingValue]=React.useState("{}");
  const [settingsInputError,setSettingsInputError]=React.useState("");

  const contentItems = (p.adminMedia || []).filter(item => {
    const term = contentSearch.trim().toLowerCase();
    const matchesSearch = !term || [
      item.title, item.artist_name, item.artist_id, item.id, item.media_type
    ].some(value => String(value || "").toLowerCase().includes(term));
    const hidden = Boolean(item.moderation_hidden);
    const matchesFilter =
      contentFilter === "all" ||
      (contentFilter === "hidden" && hidden) ||
      (contentFilter === "visible" && !hidden);
    return matchesSearch && matchesFilter;
  });
  const active = nav.find(x => x[0] === p.adminSection) || nav[0];
  const go = id => {
    p.setAdminSection?.(id); setMenu(false);
    if(id==="overview") p.loadAdminOverview?.();
    if(id==="users") p.loadAdminUsers?.(1,search);
    if(id==="verification") p.loadAdminArtistProfiles?.();
    if(id==="content") p.loadAdminMedia?.();
    if(id==="audit") p.loadAdminAuditLogs?.();
    if(id==="reports") p.loadAdminReports?.();
    if(id==="notifications") p.loadAdminNotifications?.();
    if(id==="settings") p.loadAdminSettings?.();
  };
  const back = () => { p.setAdminSuspendTarget?.(null); setSuspendReason(""); };
  const metrics = [
    ["Total users",p.adminOverview?.users ?? p.adminOverview?.total_users,"♙"],
    ["Artists",p.adminOverview?.artists ?? p.adminOverview?.total_artists,"♫"],
    ["Published media",p.adminOverview?.media ?? p.adminOverview?.total_media,"▶"],
    ["Music tracks",p.adminOverview?.tracks ?? p.adminOverview?.total_tracks,"♪"],
    ["Subscribers",p.adminOverview?.subscribers ?? p.adminOverview?.total_subscribers,"♧"],
    ["Video views",p.adminOverview?.videoViews ?? p.adminOverview?.video_views ?? p.adminOverview?.total_video_views,"▣"]
  ];
  const empty = (title,desc) => <div className="occ-empty"><b>{title}</b><p>{desc}</p></div>;
  const liveControlEnabled = key => {
    const item = (p.adminSettings || []).find(row => row.setting_key === key);
    const value = item?.setting_value;
    return typeof value === "boolean" ? value : value?.enabled ?? true;
  };
  const saveLiveControl = async (key, enabled) => {
    setSettingsInputError("");
    try {
      await p.handleSaveAdminSetting?.(key, { enabled });
    } catch (error) {
      setSettingsInputError(error.message || "Could not save platform control.");
    }
  };

  const refresh = () => {
    if(p.adminSection==="overview") p.loadAdminOverview?.();
    if(p.adminSection==="users") p.loadAdminUsers?.(p.adminUsersPage || 1,search);
    if(p.adminSection==="verification") p.loadAdminArtistProfiles?.();
    if(p.adminSection==="content") p.loadAdminMedia?.();
    if(p.adminSection==="audit") p.loadAdminAuditLogs?.();
    if(p.adminSection==="reports") p.loadAdminReports?.();
    if(p.adminSection==="notifications") p.loadAdminNotifications?.();
    if(p.adminSection==="settings") p.loadAdminSettings?.();
  };
  let page;
  if(p.adminSection==="overview") page = <>
    <div className="occ-heading"><div><small>LIVE PLATFORM STATUS</small><h2>Good to see you, Owner.</h2><p>Here’s what’s happening across Music Antenna.</p></div><button onClick={refresh}>↻ Refresh data</button></div>
    {p.adminOverviewError && <div className="occ-alert">{p.adminOverviewError}</div>}
    <div className="occ-metrics">{metrics.map(([label,value,icon])=><article className="occ-metric" key={label}><span>{label}<i>{icon}</i></span><strong>{fmt(value)}</strong><small>Live platform total</small></article>)}</div>
    <div className="occ-grid"><section className="occ-panel"><h3>Platform overview</h3><p>Live statistics from your owner dashboard service.</p>{p.adminOverviewLoading ? <div className="occ-loading">Loading live statistics…</div> : metrics.map(([label,value])=><div className="occ-stat" key={label}>{label}<b>{fmt(value)}</b></div>)}</section><section className="occ-panel"><h3>Admin shortcuts</h3><p>Go directly to an operational area.</p>{[["users","Manage users"],["verification","Review artists"],["audit","View audit logs"]].map(([id,label])=><button className="occ-shortcut" key={id} onClick={()=>go(id)}>{label}<b>→</b></button>)}</section></div>
  </>;
  else if(p.adminSection==="users") page = <>
    <div className="occ-heading"><div><small>ACCOUNT OPERATIONS</small><h2>User management</h2><p>Search accounts and manage platform access.</p></div><button onClick={refresh}>↻ Refresh</button></div>
    <section className="occ-panel"><div className="occ-search"><input value={search} placeholder="Search name, email or user ID" onChange={e=>{setSearch(e.target.value);p.setAdminUsersQuery?.(e.target.value)}} onKeyDown={e=>e.key==="Enter"&&p.loadAdminUsers?.(1,search)}/><button onClick={()=>p.loadAdminUsers?.(1,search)}>Search</button></div>
    {p.adminUsersError&&<div className="occ-alert">{p.adminUsersError}</div>}
    {p.adminUsersLoading?<div className="occ-loading">Loading user accounts…</div>:p.adminUsers?.length?<div className="occ-table-wrap"><table><thead><tr><th>USER</th><th>ROLE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{p.adminUsers.map(u=>{const id=u.id||u.user_id;const suspended=u.is_suspended||u.status==="suspended";return <tr key={id}><td><b>{u.full_name||u.display_name||u.username||u.email||"User"}</b><small>{u.email||id}</small></td><td>{u.role||"listener"}</td><td><span className={`occ-status ${suspended?"warn":"good"}`}>{suspended?"Suspended":"Active"}</span></td><td>{suspended?<button disabled={p.adminUserBusyId===id} onClick={()=>p.handleAdminUserAction?.("restore_user",id)}>Restore</button>:<button className="danger" disabled={p.adminUserBusyId===id} onClick={()=>{p.setAdminSuspendTarget?.(u);setSuspendReason("")}}>Suspend</button>}</td></tr>})}</tbody></table></div>:empty("No user accounts to show","Search for an account or refresh the live user list.")}
    <div className="occ-pagination"><span>{fmt(p.adminUsersTotal)} accounts · Page {p.adminUsersPage||1}</span><div><button disabled={(p.adminUsersPage||1)<=1||p.adminUsersLoading} onClick={()=>{let n=(p.adminUsersPage||1)-1;p.setAdminUsersPage?.(n);p.loadAdminUsers?.(n,search)}}>Previous</button><button disabled={p.adminUsersLoading||(p.adminUsers?.length||0)<25} onClick={()=>{let n=(p.adminUsersPage||1)+1;p.setAdminUsersPage?.(n);p.loadAdminUsers?.(n,search)}}>Next</button></div></div></section>
  </>;
  else if(p.adminSection==="verification") page = <>
    <div className="occ-heading"><div><small>CREATOR TRUST</small><h2>Artist verification</h2><p>Review creator applications and update verification status.</p></div><button onClick={refresh}>↻ Refresh</button></div>
    {p.adminArtistMessage&&<div className="occ-alert">{p.adminArtistMessage}</div>}
    <section className="occ-panel">{p.adminArtistLoading?<div className="occ-loading">Loading artist applications…</div>:p.adminArtistProfiles?.length?<div className="occ-table-wrap"><table><thead><tr><th>ARTIST</th><th>STATUS</th><th>REGION</th><th>REVIEW</th></tr></thead><tbody>{p.adminArtistProfiles.map(a=>{const id=a.user_id||a.id;return <tr key={id}><td><b>{a.artist_name||a.stage_name||a.full_name||"Artist"}</b><small>{a.email||id}</small></td><td><span className="occ-status">{a.verification_status||"pending"}</span></td><td>{a.region||a.region_name||"—"}</td><td><button disabled={p.adminReviewBusyId===id||a.verification_status==="verified"} onClick={()=>p.handleAdminSetArtistVerification?.(id,"verified")}>Approve</button> <button disabled={p.adminReviewBusyId===id||a.verification_status==="rejected"} onClick={()=>p.handleAdminSetArtistVerification?.(id,"rejected")}>Reject</button></td></tr>})}</tbody></table></div>:empty("No artist applications","New creator applications will appear here.")}</section>
  </>;
  else if(p.adminSection==="content") page = <>
    <div className="occ-heading">
      <div>
        <small>TRUST, SAFETY & PUBLISHING</small>
        <h2>Content moderation</h2>
        <p>Review real music and video records. Hidden media is unavailable to public readers.</p>
      </div>
      <button onClick={refresh}>↻ Refresh media</button>
    </div>

    {p.adminMediaError && <div className="occ-alert">{p.adminMediaError}</div>}

    <section className="occ-panel">
      <div className="occ-search occ-content-search">
        <input
          value={contentSearch}
          placeholder="Search title, artist or media ID"
          onChange={e => setContentSearch(e.target.value)}
        />
        <select
          value={contentFilter}
          onChange={e => setContentFilter(e.target.value)}
          aria-label="Filter moderation records"
        >
          <option value="all">All media</option>
          <option value="visible">Visible media</option>
          <option value="hidden">Hidden media</option>
        </select>
      </div>

      <div className="occ-content-summary">
        <span>{fmt(p.adminMedia?.length)} records loaded</span>
        <span>{fmt((p.adminMedia || []).filter(item => item.moderation_hidden).length)} hidden</span>
        <span>{fmt(contentItems.length)} matching</span>
      </div>

      {p.adminMediaLoading
        ? <div className="occ-loading">Loading platform media…</div>
        : contentItems.length
          ? <div className="occ-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>CONTENT</th>
                    <th>TYPE</th>
                    <th>ARTIST</th>
                    <th>VIEWS</th>
                    <th>REPORTS</th>
                    <th>STATE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {contentItems.map(item => {
                    const hidden = Boolean(item.moderation_hidden);
                    const busy = p.adminMediaBusyId === item.id;
                    return <tr key={item.id}>
                      <td>
                        <b>{item.title || "Untitled media"}</b>
                        <small>{item.id}</small>
                        <small>{when(item.created_at)}</small>
                      </td>
                      <td>{item.media_type || "—"}</td>
                      <td>
                        {item.artist_name || "Artist"}
                        <small>{item.artist_id}</small>
                      </td>
                      <td>{fmt(item.views)}</td>
                      <td>{fmt(item.report_count)}</td>
                      <td>
                        <span className={`occ-status ${hidden ? "danger" : "good"}`}>
                          {hidden ? "Hidden" : "Public"}
                        </span>
                      </td>
                      <td>
                        {hidden
                          ? <button
                              disabled={busy || p.adminMediaLoading}
                              onClick={() => {
                                if (window.confirm("Restore this media to public availability?")) {
                                  p.handleAdminMediaModeration?.(item.id, false);
                                }
                              }}
                            >{busy ? "Working…" : "Restore"}</button>
                          : <button
                              className="danger"
                              disabled={busy || p.adminMediaLoading}
                              onClick={() => {
                                if (window.confirm("Hide this media from public readers? The media file and artist publication status will remain unchanged.")) {
                                  p.handleAdminMediaModeration?.(item.id, true);
                                }
                              }}
                            >{busy ? "Working…" : "Hide"}</button>
                        }
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          : empty(
              p.adminMedia?.length ? "No matching media" : "No media records found",
              p.adminMedia?.length
                ? "Try another search or filter."
                : "Media records from Supabase will appear here when available."
            )
      }
    </section>
  </>;
  else if(p.adminSection==="reports") page = <>
    <div className="occ-heading">
      <div><small>TRUST & SAFETY</small><h2>Content reports</h2><p>Review reports submitted by signed-in users.</p></div>
      <button onClick={refresh}>↻ Refresh reports</button>
    </div>
    {p.adminReportsError && <div className="occ-alert">{p.adminReportsError}</div>}
    <section className="occ-panel">
      {p.adminReportsLoading ? <div className="occ-loading">Loading submitted reports…</div>
      : p.adminReports?.length ? <div className="occ-table-wrap">
        <table>
          <thead><tr><th>REPORT</th><th>MEDIA ID</th><th>REPORTER</th><th>STATUS</th><th>SUBMITTED</th><th>ACTION</th></tr></thead>
          <tbody>{p.adminReports.map(r => <tr key={r.id}>
            <td><b>{r.reason || "Report"}</b><small>{r.details || "No additional details"}</small></td>
            <td>{r.media_id}</td>
            <td>{r.reporter_id}</td>
            <td><span className={`occ-status ${r.status === "resolved" ? "good" : r.status === "dismissed" ? "warn" : ""}`}>{r.status}</span></td>
            <td>{when(r.created_at)}</td>
            <td>
              <button disabled={p.adminReportBusyId === r.id || r.status === "resolved" || r.status === "dismissed"} onClick={() => p.handleAdminReportReview?.(r.id,"reviewing")}>Review</button>{" "}
              <button disabled={p.adminReportBusyId === r.id || r.status === "resolved" || r.status === "dismissed"} onClick={() => p.handleAdminReportReview?.(r.id,"resolved","Reviewed and resolved by owner.")}>Resolve</button>{" "}
              <button className="danger" disabled={p.adminReportBusyId === r.id || r.status === "resolved" || r.status === "dismissed"} onClick={() => p.handleAdminReportReview?.(r.id,"dismissed","Report dismissed by owner.")}>Dismiss</button>
            </td>
          </tr>)}</tbody>
        </table>
      </div> : empty("No reports submitted","User-submitted reports will appear here.") }
    </section>
  </>;
  else if(p.adminSection==="audit") page = <>
    <div className="occ-heading"><div><small>SECURITY & ACCOUNTABILITY</small><h2>Audit logs</h2><p>Review administrative activity on your platform.</p></div><button onClick={refresh}>↻ Refresh logs</button></div>
    {p.adminAuditError&&<div className="occ-alert">{p.adminAuditError}</div>}
    <section className="occ-panel">{p.adminAuditLoading?<div className="occ-loading">Loading audit records…</div>:p.adminAuditLogs?.length?<div className="occ-table-wrap"><table><thead><tr><th>EVENT</th><th>ACTOR</th><th>DETAILS</th><th>TIME</th></tr></thead><tbody>{p.adminAuditLogs.map((a,i)=><tr key={a.id||i}><td>{a.action||a.event_type||"Admin event"}</td><td>{a.admin_email||a.actor_email||a.admin_user_id||a.actor_id||"Owner"}</td><td>{typeof a.details === "string" ? a.details : a.details ? JSON.stringify(a.details) : a.reason || a.target_user_id || "—"}</td><td>{when(a.created_at||a.timestamp)}</td></tr>)}</tbody></table></div>:empty("No audit activity yet","Administrative actions will appear here when recorded.")}</section>
  </>;
  
  else if(p.adminSection==="notifications") page = <>
    <div className="occ-heading">
      <div><small>OWNER WORKSPACE</small><h2>Notifications</h2><p>Your owner-account notification inbox.</p></div>
      <button onClick={()=>p.loadAdminNotifications?.()}>↻ Refresh</button>
    </div>
    {p.adminNotificationsError && <div className="occ-alert">{p.adminNotificationsError}</div>}
    {p.adminNotificationsLoading ? <div className="occ-loading">Loading notifications...</div> :
      !p.adminNotifications?.length ? empty("No notifications","Your owner inbox is currently empty.") :
      <section className="occ-panel">
        <div className="occ-table-wrap"><table>
          <thead><tr><th>NOTIFICATION</th><th>DETAILS</th><th>DATE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>{p.adminNotifications.map(n=><tr key={n.id}>
            <td>{n.type || "Notification"}</td>
            <td>{n.message || n.comment_text || n.reply_text || (n.media_id ? "Media notification" : "No additional details")}</td>
            <td>{when(n.created_at)}</td>
            <td><span className={"occ-status " + (n.is_read ? "" : "warn")}>{n.is_read ? "Read" : "Unread"}</span></td>
            <td>
              <button disabled={p.adminNotificationBusyId===n.id} onClick={()=>p.handleAdminNotificationRead?.(n.id,!n.is_read)}>{n.is_read ? "Mark unread" : "Mark read"}</button>
              <button className="danger" disabled={p.adminNotificationBusyId===n.id} onClick={()=>{if(window.confirm("Delete this notification?"))p.handleAdminNotificationDelete?.(n.id)}}>Delete</button>
            </td>
          </tr>)}</tbody>
        </table></div>
      </section>}
  </>
  else if(p.adminSection==="settings") page = <>
    <div className="occ-heading">
      <div><small>OWNER WORKSPACE / CONFIGURATION</small><h2>Platform settings</h2><p>Organise and manage saved platform configuration values.</p></div>
      <button type="button" onClick={()=>p.loadAdminSettings?.()} disabled={p.adminSettingsLoading}>↻ {p.adminSettingsLoading ? "Loading..." : "Refresh"}</button>
    </div>
    {p.adminSettingsError && <div className="occ-alert" role="alert">{p.adminSettingsError}</div>}
    {p.adminSettingsMessage && <div className="occ-settings-success" role="status">✓ {p.adminSettingsMessage}</div>}
    {settingsInputError && <div className="occ-alert" role="alert">{settingsInputError}</div>}

    <section className="occ-panel" style={{marginBottom:16}}>
      <h3>Live Platform Controls</h3>
      <p>Manage platform settings from your owner console.</p>
      <div className="occ-settings-category-grid">
        {[
          ["Maintenance mode","Temporarily restrict normal platform access","platform.maintenance"],
          ["New user registration","Allow or pause new account registrations","accounts.registration_enabled"],
          ["Music uploads","Allow or pause music uploads","uploads.music"],
          ["Video uploads","Allow or pause video uploads","uploads.video"],
          ["Platform notifications","Enable or pause platform notifications","notifications.platform"]
        ].map(([name,description,key])=><label className="occ-settings-category" key={key} style={{display:"flex",gap:12,alignItems:"center",cursor:"pointer"}}>
          <input type="checkbox" checked={liveControlEnabled(key)} disabled={p.adminSettingsBusy || p.adminSettingsLoading} onChange={e=>saveLiveControl(key,e.target.checked)} />
          <span style={{display:"grid",gap:5}}><strong>{name}</strong><span>{description}</span><small>{liveControlEnabled(key) ? "Enabled" : "Disabled"}</small></span>
        </label>)}
        <article className="occ-settings-category">
          <strong>Security</strong>
          <span>Existing owner-only access policies remain active. Additional security controls require server-side enforcement.</span>
          <small>Protected by existing access policies</small>
        </article>
      </div>
    </section>

    <section className="occ-panel occ-settings-categories">
      <h3>Configuration categories</h3>
      <p>Choose a category to start a setting key with its namespace.</p>
      <div className="occ-settings-category-grid">
        {[
          ["General","Platform identity and preferences","general."],
          ["Accounts","Registration and account preferences","accounts."],
          ["Content","Upload and content preferences","content."],
          ["Notifications","Notification preferences","notifications."],
          ["Security","Session and access preferences","security."],
          ["Monetization","Plans and payment configuration","monetization."]
        ].map(([name,description,prefix])=><button type="button" className="occ-settings-category" key={name} onClick={()=>{setNewSettingKey(prefix);setSettingsInputError("");document.getElementById("occ-setting-key")?.focus();}}>
          <strong>{name}</strong><span>{description}</span><small>Use {prefix}</small>
        </button>)}
      </div>
      <p className="occ-settings-note">Categories organise stored configuration keys. A setting changes live platform behaviour only when the relevant Music Antenna feature is programmed to read it.</p>
    </section>

    <section className="occ-panel occ-settings-editor">
      <h3>Add platform setting</h3>
      <p>Save a key and its JSON value to Supabase.</p>
      <div className="occ-settings-form">
        <div className="occ-setting-field">
          <label htmlFor="occ-setting-key">Setting key</label>
          <input id="occ-setting-key" value={newSettingKey} onChange={e=>setNewSettingKey(e.target.value)} placeholder="example: general.platform_name" autoComplete="off" />
          <small>Use a clear category prefix.</small>
        </div>
        <div className="occ-setting-field">
          <label htmlFor="occ-setting-value">JSON value</label>
          <textarea id="occ-setting-value" rows="5" value={newSettingValue} onChange={e=>setNewSettingValue(e.target.value)} spellCheck="false" placeholder='{"enabled": true}' />
          <small>Enter valid JSON: text in quotes, numbers, true/false, arrays or objects.</small>
        </div>
        <div className="occ-settings-form-actions">
          <button type="button" disabled={p.adminSettingsBusy} onClick={async()=>{
            setSettingsInputError("");
            try {
              if(!newSettingKey.trim()) throw new Error("Enter a setting key.");
              const parsed=JSON.parse(newSettingValue);
              await p.handleSaveAdminSetting?.(newSettingKey.trim(),parsed);
              setNewSettingKey(""); setNewSettingValue("{}");
            } catch(e) { setSettingsInputError(e.message || "Could not save setting. Check JSON and Supabase permissions."); }
          }}>{p.adminSettingsBusy ? "Saving..." : "Save setting"}</button>
        </div>
      </div>
    </section>

    <section className="occ-panel occ-settings-existing">
      <h3>Saved configuration</h3>
      <p>{p.adminSettings?.length || 0} saved setting(s)</p>
      {p.adminSettingsLoading ? <div className="occ-loading">Loading settings...</div> :
       !p.adminSettings?.length ? empty("No settings saved","Choose a category above or add your first setting.") :
       <div className="occ-settings-list">{p.adminSettings.map(setting=><article className="occ-settings-item" key={setting.setting_key}>
          <div className="occ-settings-item-head"><strong>{setting.setting_key}</strong><span className="occ-status">Saved</span></div>
          {editingSettingKey===setting.setting_key ? <div className="occ-setting-field">
            <label>Edit JSON value</label>
            <textarea rows="6" value={editingSettingValue} onChange={e=>setEditingSettingValue(e.target.value)} spellCheck="false" />
            <div className="occ-settings-item-actions">
              <button type="button" disabled={p.adminSettingsBusy} onClick={async()=>{
                setSettingsInputError("");
                try { const parsed=JSON.parse(editingSettingValue); await p.handleSaveAdminSetting?.(setting.setting_key,parsed); setEditingSettingKey(null); }
                catch(e) { setSettingsInputError(e.message || "Could not update setting."); }
              }}>{p.adminSettingsBusy ? "Saving..." : "Save changes"}</button>
              <button type="button" onClick={()=>setEditingSettingKey(null)}>Cancel</button>
            </div>
          </div> : <pre className="occ-settings-json">{JSON.stringify(setting.setting_value,null,2)}</pre>}
          {editingSettingKey!==setting.setting_key && <div className="occ-settings-item-actions">
            <button type="button" onClick={()=>{setSettingsInputError("");setEditingSettingKey(setting.setting_key);setEditingSettingValue(JSON.stringify(setting.setting_value,null,2));}}>Edit</button>
            <button type="button" className="danger" disabled={p.adminSettingsBusy} onClick={()=>{if(window.confirm("Delete setting " + setting.setting_key + "?"))p.handleDeleteAdminSetting?.(setting.setting_key);}}>Delete</button>
          </div>}
       </article>)}</div>}
    </section>
  </>
  else page = <><div className="occ-heading"><div><small>OWNER WORKSPACE</small><h2>{active[1]}</h2><p>Administration workspace for {active[1].toLowerCase()}.</p></div></div><section className="occ-panel occ-placeholder"><strong>{active[1]}</strong><p>This area will only show controls after its owner-only database permissions and secure backend actions are connected. No simulated controls or sample records are displayed.</p><span className="occ-status warn">Backend integration required</span></section></>;

  if(typeof document==="undefined") return null;
  return createPortal(<div className="ma-owner-centre">
    <aside className={`occ-sidebar ${menu?"open":""}`}><div className="occ-brand"><b className="occ-logo">M</b><span><strong>MUSIC ANTENNA</strong><small>OWNER CONSOLE</small></span><button className="occ-close" onClick={()=>setMenu(false)}>×</button></div>
    <div className="occ-owner"><b>{(p.session?.user?.email||"O").slice(0,1).toUpperCase()}</b><span><strong>Platform owner</strong><small>{p.session?.user?.email||"Owner account"}</small></span><i/></div>
    {["Workspace","Management","Insights","System"].map(group=><div className="occ-nav-group" key={group}><label>{group}</label>{nav.filter(n=>n[0]==="overview"&&group==="Workspace"||n[0]==="users"&&group==="Workspace"||n[0]==="verification"&&group==="Workspace"||n[0]==="content"&&group==="Management"||n[0]==="reports"&&group==="Management"||n[0]==="analytics"&&group==="Insights"||n[0]==="audit"&&group==="Insights"||n[0]==="notifications"&&group==="System"||n[0]==="settings"&&group==="System").map(n=><button className={p.adminSection===n[0]?"active":""} key={n[0]} onClick={()=>go(n[0])}><i>{n[2]}</i>{n[1]}{p.adminSection===n[0]&&<em/>}</button>)}</div>)}
    <div className="occ-sidebar-bottom"><small>◈ Secure owner session</small><button onClick={p.onBack}>← Back to Music Antenna</button></div></aside>
    {menu&&<button className="occ-backdrop" onClick={()=>setMenu(false)} aria-label="Close menu"/>}
    <main className="occ-main"><header className="occ-topbar"><div><button className="occ-menu" onClick={()=>setMenu(true)}>☰</button><span>OWNER CONSOLE / {active[1].toUpperCase()}</span><h1>{active[1]}</h1><button className="occ-header-back" onClick={p.onBack}>← Back to Music Antenna</button></div><span className="occ-access">● Owner access</span></header><div className="occ-content">{page}<footer>Music Antenna Owner Console <span>Private administration workspace</span></footer></div></main>
    {p.adminSuspendTarget&&<div className="occ-modal-backdrop"><section className="occ-modal"><button className="occ-close-modal" onClick={back}>×</button><h2>Suspend account?</h2><p>This restricts access for <b>{p.adminSuspendTarget.email||p.adminSuspendTarget.full_name||p.adminSuspendTarget.id}</b>. Add a reason for the audit record.</p><label>Reason<textarea rows="3" value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} placeholder="Explain why this account is being suspended…"/></label><div><button onClick={back}>Cancel</button><button className="danger" disabled={!suspendReason.trim()} onClick={()=>{p.handleAdminUserAction?.("suspend_user",p.adminSuspendTarget.id||p.adminSuspendTarget.user_id,suspendReason);back()}}>Confirm suspension</button></div></section></div>}
  </div>,document.body);
}
