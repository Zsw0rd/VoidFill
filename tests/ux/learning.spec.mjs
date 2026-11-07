import { test, expect } from "@playwright/test";
const pageErrors=new WeakMap();

test.beforeEach(async({context,page})=>{
  const errors=[]; pageErrors.set(page,errors); page.on("pageerror",error=>errors.push(error.message));
  const response=await context.request.post("/api/demo/start",{data:{key:process.env.DEMO_ENTRY_KEY,role:0}});
  expect(response.status()).toBe(200);
  expect((await context.request.post("/api/demo/lease",{data:{tab:"isolated-ux-check"}})).status()).toBe(200);
});
test.afterEach(async({context,page})=>{await context.request.post("/api/demo/end").catch(()=>{}); expect(pageErrors.get(page)||[]).toEqual([]);});

test("overview exposes a useful learning sequence and practical navigation",async({page},info)=>{
  await page.goto("/dashboard");
  await expect(page.getByRole("heading",{name:"This week’s route"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Open practical studio",exact:true})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Main navigation"}).getByRole("link",{name:"Practical studio"})).toBeVisible();
  await expect(page.getByText("XP tracks participation, not job readiness.")).toBeVisible();
  await page.screenshot({path:info.outputPath("overview-desktop.png"),fullPage:true});
});

test("atlas supports skill discovery, honest empty filters and the list alternative",async({page},info)=>{
  await page.goto("/roadmap");
  await expect(page.getByRole("heading",{name:"Your foundation milestones"})).toBeVisible();
  await page.getByRole("searchbox",{name:"Search skills in your roadmap"}).fill("SQL");
  await expect(page.getByRole("status").filter({hasText:/1 of \d+ areas/})).toBeVisible();
  await page.getByRole("combobox",{name:"Filter skills by learning progress"}).selectOption("target");
  await expect(page.getByRole("heading",{name:"No skills match this view."})).toBeVisible();
  await page.getByRole("button",{name:"Show all learning areas"}).click();
  await page.getByRole("button",{name:"List",exact:true}).click();
  await expect(page.getByRole("region",{name:/Interactive skill map/})).toHaveCount(0);
  await page.getByRole("button",{name:"Map",exact:true}).click();
  await expect(page.getByRole("region",{name:/Interactive skill map/})).toBeVisible();
  await page.locator(".learning-atlas").screenshot({path:info.outputPath("atlas-desktop.png")});
});

test("career comparison and intermediate milestones preview without changing the saved goal",async({page})=>{
  await page.goto("/careers");
  const before=await (await page.request.post("/api/demo/db",{data:{table:"profiles",single:"required"}})).json();
  await page.locator("summary").filter({hasText:"Compare career paths"}).click();
  await page.getByRole("combobox",{name:"Add a career to compare"}).selectOption({label:"Data Analyst"});
  await page.getByRole("combobox",{name:"Add a career to compare"}).selectOption({label:"Frontend Developer"});
  await expect(page.locator(".career-compare-grid article")).toHaveCount(2);
  await page.locator(".career-compare-grid article").filter({has:page.getByRole("heading",{name:"Frontend Developer",exact:true})}).getByRole("button",{name:"Preview this direction"}).click();
  await page.getByRole("combobox",{name:"Learning level",exact:true}).selectOption("intermediate");
  await expect(page.getByRole("heading",{name:"Your intermediate milestones"})).toBeVisible();
  const profile=await page.request.post("/api/demo/db",{data:{table:"profiles",single:"required"}});
  expect((await profile.json()).data).toEqual(before.data);
  await page.getByRole("link",{name:"Work on a practical activity"}).click();
  await expect(page.getByRole("combobox",{name:"Your activity"}).locator("option:checked")).toHaveText("Frontend Developer");
  await expect(page.getByRole("combobox",{name:"Learning stage"})).toHaveValue("intermediate");
});

test("stored skill deep links survive loading and same-page milestone navigation",async({page})=>{
  const sql=await (await page.request.post("/api/demo/db",{data:{table:"skills",filters:[{column:"name",op:"eq",value:"SQL Fundamentals"}],single:"required"}})).json();
  await page.goto(`/roadmap?skill=${sql.data.id}#learning-map`);
  await expect(page.getByRole("button",{name:/^SQL Fundamentals\. .*Not assessed/})).toHaveAttribute("aria-pressed","true");
  await page.getByRole("link",{name:"Python Basics",exact:true}).first().click();
  await expect(page.getByRole("button",{name:/^Python Basics\. .*Not assessed/})).toHaveAttribute("aria-pressed","true");
});

test("private practical drafts save without XP and expose an explicit sharing boundary",async({page},info)=>{
  await page.goto("/practical");
  await expect(page.getByRole("heading",{name:"Turn learning into something real."})).toBeVisible();
  await page.getByRole("textbox",{name:/Evidence and explanation/}).fill("Synthetic project: I checked the source records, explained the assumptions, compared the results and documented one improvement after testing.");
  await page.getByRole("button",{name:/Save.*draft/i}).click();
  await expect(page.getByRole("status")).toContainText(/saved/i);
  const stats=await page.request.post("/api/demo/db",{data:{table:"user_stats",single:"required"}});
  expect((await stats.json()).data.xp).toBe(0);
  await page.screenshot({path:info.outputPath("practical-desktop.png"),fullPage:true});
});

test("phone layouts stay within the viewport with readable controls",async({page},info)=>{
  await page.setViewportSize({width:355,height:820});
  for(const route of ["/dashboard","/roadmap","/careers","/practical"]){
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),route).toBe(true);
    expect(await page.locator("body").innerText()).not.toContain("Application error");
  }
  await page.screenshot({path:info.outputPath("practical-phone.png"),fullPage:true});
});

test("a second daily tab shows the saved attempt without mismatched answer review or a new award",async({page})=>{
  await page.route("**/api/ai/generate-questions",route=>route.fulfill({json:{questions:[{id:"synthetic-question",prompt:"Which action checks this result?",options:["Compare with the stated inputs","Assume it is correct"],difficulty:1,skill_name:"SQL"}],assessment_token:"ui-contract-only",difficulty:1,difficultyLabel:"Foundation"}}));
  await page.route("**/api/daily-test/submit",route=>route.fulfill({json:{alreadyCompleted:true,completed_at:"2026-11-06T00:00:00Z",correct_count:7,total_count:10,xp_earned:85,review:[]}}));
  await page.goto("/daily-test");
  await page.getByRole("button",{name:"Begin today’s assessment"}).click();
  await page.getByText("Compare with the stated inputs",{exact:true}).click();
  await expect(page.getByRole("radio",{name:/Compare with the stated inputs/})).toBeChecked();
  await page.getByRole("button",{name:"Finish assessment"}).click();
  await expect(page.getByText(/Today’s saved assessment: 7\/10/)).toBeVisible();
  await expect(page.getByText(/This submission did not award additional XP/)).toBeVisible();
  await expect(page.getByRole("heading",{name:"Question Review"})).toHaveCount(0);
});
