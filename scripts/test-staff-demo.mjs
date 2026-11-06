import assert from "node:assert/strict";
import { configure } from "./runtime.mjs";
configure();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const jars = [];
async function call(jar, path, body = {}, expected = 200) {
  const response = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", Cookie: jar.cookie || "" }, body: JSON.stringify(body), redirect: "manual" });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) jar.cookie = cookies.map(v => v.split(";")[0]).join("; ");
  assert.equal(response.status, expected, path);
  return response.json();
}
try {
  await call({}, "/api/demo/start", {key:process.env.DEMO_ENTRY_KEY, staff:true, email:"admin@demo.voidfill.local",password:"wrong"},401);
  for (const [email, passwordName, destination, pages] of [
    ["admin@demo.voidfill.local", "DEMO_ADMIN_PASSWORD", "/admin/dashboard", ["dashboard", "users", "mentors", "flagged", "profile"]],
    ["mentor@demo.voidfill.local", "DEMO_MENTOR_PASSWORD", "/admin/mentor", ["mentor", "mentor/chat", "profile"]],
    ["mentor2@demo.voidfill.local", "DEMO_MENTOR2_PASSWORD", "/admin/mentor", ["mentor", "mentor/chat"]],
  ]) {
    const jar = {}; jars.push(jar);
    assert.equal((await call(jar, "/api/demo/start", { key:process.env.DEMO_ENTRY_KEY, staff:true,email,password:process.env[passwordName] })).redirect,destination);
    const user = (await call(jar,"/api/demo/user")).data.user;
    for (const page of pages) {
      await call(jar,"/api/demo/lease",{tab:"staff-http-test"});
      const response = await fetch(base + "/admin/" + page,{headers:{Cookie:jar.cookie},redirect:"manual"});
      assert.equal(response.status,200,page);
      const html = await response.text();
      assert.ok(!html.includes("Application error"),page);
      if (page === "users") assert.ok(html.includes("Aarav Sharma") && html.includes("Ishita Sen"));
      if (page === "mentor") assert.ok(html.includes("3 assigned students"));
    }
    const profiles = (await call(jar,"/api/demo/db",{table:"profiles"})).data;
    assert.equal(profiles.length,email.startsWith("admin") ? 6 : 3);
    if (email.startsWith("admin")) {
      const learner = profiles[0];
      await call(jar,"/api/demo/db",{table:"mentor_assignments",operation:"delete",filters:[{column:"user_id",op:"eq",value:learner.id}]});
      await call(jar,"/api/demo/db",{table:"mentor_assignments",operation:"insert",values:{mentor_id:user.id,user_id:learner.id}});
      const workspace = await fetch(base+"/admin/mentor",{headers:{Cookie:jar.cookie},redirect:"manual"});
      assert.equal(workspace.status,200);
      const html = await workspace.text();
      assert.ok(html.includes("Platform workspace") && html.includes("Your mentoring workspace"));
      const lookup = await fetch(base+"/api/chat/mentor-conversations?studentId="+learner.id,{headers:{Cookie:jar.cookie}});
      assert.equal(lookup.status,200);
      assert.equal((await lookup.json()).conversationId,null,"Reassignment must not expose another mentor's conversation");
      await call(jar,"/api/chat/mentor-send",{targetUserId:learner.id,conversationId:null,message:"Synthetic dual-role verification reply"});
      const messages = (await call(jar,"/api/demo/db",{table:"chat_messages"})).data;
      assert.ok(messages.some(message=>message.sender_id===user.id && message.sender_role==="mentor" && message.content==="Synthetic dual-role verification reply"));
      await call(jar,"/api/chat/mentor-send",{targetUserId:profiles[1].id,message:"Synthetic unassigned reply"},403);
    }
    if (!email.startsWith("admin")) {
      const deny = await fetch(base+"/admin/users",{headers:{Cookie:jar.cookie},redirect:"manual"});
      assert.equal(deny.status,307);
      assert.equal(new URL(deny.headers.get("location"),base).pathname,"/admin/mentor");
      await call(jar,"/api/demo/db",{table:"admin_users",operation:"update",values:{admin_role:"super_admin"}},403);
      const conversation = (await call(jar,"/api/demo/db",{table:"chat_conversations",limit:1})).data[0];
      await call(jar,"/api/chat/mentor-send",{targetUserId:conversation.user_id,conversationId:conversation.id,message:"Synthetic demo verification reply"});
      const messages = (await call(jar,"/api/demo/db",{table:"chat_messages",filters:[{column:"conversation_id",op:"eq",value:conversation.id}]})).data;
      assert.ok(messages.some(m=>m.content==="Synthetic demo verification reply" && m.sender_id===user.id));
    }
  }
  console.log("Staff demo logins, dual admin/mentor workspaces, assignment checks, conversation isolation and synthetic mentor replies passed.");
} finally {
  for (const jar of jars) if (jar.cookie) await call(jar,"/api/demo/end").catch(()=>{});
}
