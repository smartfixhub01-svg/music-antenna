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
  const active = nav.find(x => x[0] === p.adminSection) || nav[0];
  const go = id => {
    p.setAdminSection?.(id); setMenu(false);
    if(id==="overview") p.loadAdminOverview?.();
    if(id==="users") p.loadAdminUsers?.(1,search);
    if(id==="verification") p.loadAdminArtistProfiles?.();
    if(id==="audit") p.loadAdminAuditLogs?.();
  };
  const back = () => { p.setAdminSuspendTarget?.(null); setSuspendReason(""); };
  const metrics = [
    ["Total users",p.adminOverview?.users ?? p.adminOverview?.total_users,"♙"],
    ["Artists",p.adminOverview?.artists ?? p.adminOverview?.total_artists,"♫"],
    ["Published media",p.adminOverview?.media ?? p.adminOverview?.total_media,"▶"],
    ["Music tracks",p.adminOverview?.tracks ?? p.adminOverview?.total_tracks,"♪"],
    ["Subscribers",p.adminOverview?.subscribers ?? p.adminOverview?.total_subscribers,"♧"],
    ["Video views",p.adminOverview?.video_views ?? p.adminOverview?.total_video_views,"▣"]
  ];
  const empty = (title,desc) => <div className="occ-empty"><b>{title}</b><p>{desc}</p></div>;
  const refresh = () => {
    if(p.adminSection==="overview") p.loadAdminOverview?.();
    if(p.adminSection==="users") p.loadAdminUsers?.(p.adminUsersPage || 1,search);
    if(p.adminSection==="verification") p.loadAdminArtistProfiles?.();
    if(p.adminSection==="audit") p.loadAdminAuditLogs?.();
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
  else if(p.adminSection==="audit") page = <>
    <div className="occ-heading"><div><small>SECURITY & ACCOUNTABILITY</small><h2>Audit logs</h2><p>Review administrative activity on your platform.</p></div><button onClick={refresh}>↻ Refresh logs</button></div>
    {p.adminAuditError&&<div className="occ-alert">{p.adminAuditError}</div>}
    <section className="occ-panel">{p.adminAuditLoading?<div className="occ-loading">Loading audit records…</div>:p.adminAuditLogs?.length?<div className="occ-table-wrap"><table><thead><tr><th>EVENT</th><th>ACTOR</th><th>DETAILS</th><th>TIME</th></tr></thead><tbody>{p.adminAuditLogs.map((a,i)=><tr key={a.id||i}><td>{a.action||a.event_type||"Admin event"}</td><td>{a.admin_email||a.actor_email||a.admin_user_id||"Owner"}</td><td>{a.details||a.reason||a.target_user_id||"—"}</td><td>{when(a.created_at||a.timestamp)}</td></tr>)}</tbody></table></div>:empty("No audit activity yet","Administrative actions will appear here when recorded.")}</section>
  </>;
  else page = <><div className="occ-heading"><div><small>OWNER WORKSPACE</small><h2>{active[1]}</h2><p>Administration workspace for {active[1].toLowerCase()}.</p></div></div><section className="occ-panel occ-placeholder"><strong>{active[1]}</strong><p>This area will only show controls after its owner-only database permissions and secure backend actions are connected. No simulated controls or sample records are displayed.</p><span className="occ-status warn">Backend integration required</span></section></>;

  if(typeof document==="undefined") return null;
  return createPortal(<div className="ma-owner-centre">
    <aside className={`occ-sidebar ${menu?"open":""}`}><div className="occ-brand"><b className="occ-logo">M</b><span><strong>MUSIC ANTENNA</strong><small>OWNER CONSOLE</small></span><button className="occ-close" onClick={()=>setMenu(false)}>×</button></div>
    <div className="occ-owner"><b>{(p.session?.user?.email||"O").slice(0,1).toUpperCase()}</b><span><strong>Platform owner</strong><small>{p.session?.user?.email||"Owner account"}</small></span><i/></div>
    {["Workspace","Management","Insights","System"].map(group=><div className="occ-nav-group" key={group}><label>{group}</label>{nav.filter(n=>n[0]==="overview"&&group==="Workspace"||n[0]==="users"&&group==="Workspace"||n[0]==="verification"&&group==="Workspace"||n[0]==="content"&&group==="Management"||n[0]==="reports"&&group==="Management"||n[0]==="analytics"&&group==="Insights"||n[0]==="audit"&&group==="Insights"||n[0]==="notifications"&&group==="System"||n[0]==="settings"&&group==="System").map(n=><button className={p.adminSection===n[0]?"active":""} key={n[0]} onClick={()=>go(n[0])}><i>{n[2]}</i>{n[1]}{p.adminSection===n[0]&&<em/>}</button>)}</div>)}
    <div className="occ-sidebar-bottom"><small>◈ Secure owner session</small><button onClick={p.onBack}>← Back to Music Antenna</button></div></aside>
    {menu&&<button className="occ-backdrop" onClick={()=>setMenu(false)} aria-label="Close menu"/>}
    <main className="occ-main"><header className="occ-topbar"><div><button className="occ-menu" onClick={()=>setMenu(true)}>☰</button><span>OWNER CONSOLE / {active[1].toUpperCase()}</span><h1>{active[1]}</h1></div><span className="occ-access">● Owner access</span></header><div className="occ-content">{page}<footer>Music Antenna Owner Console <span>Private administration workspace</span></footer></div></main>
    {p.adminSuspendTarget&&<div className="occ-modal-backdrop"><section className="occ-modal"><button className="occ-close-modal" onClick={back}>×</button><h2>Suspend account?</h2><p>This restricts access for <b>{p.adminSuspendTarget.email||p.adminSuspendTarget.full_name||p.adminSuspendTarget.id}</b>. Add a reason for the audit record.</p><label>Reason<textarea rows="3" value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} placeholder="Explain why this account is being suspended…"/></label><div><button onClick={back}>Cancel</button><button className="danger" disabled={!suspendReason.trim()} onClick={()=>{p.handleAdminUserAction?.("suspend_user",p.adminSuspendTarget.id||p.adminSuspendTarget.user_id,suspendReason);back()}}>Confirm suspension</button></div></section></div>}
  </div>,document.body);
}
