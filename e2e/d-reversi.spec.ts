import { expect, test } from "@playwright/test";

const baseUrl = new URL(process.env.BASE_URL || "http://127.0.0.1:3000");
const pageUrl = new URL("/app/d-reversi", baseUrl);

/** セル [x, y] の <g> 要素セレクタ */
const cellG = (x: number, y: number) =>
	`[id="${encodeURIComponent(`cell${x},${y}`)}"]`;

/** セル [x, y] の前面 <rect>（クリック可能なゲームピース） */
const foreRect = (x: number, y: number) => `${cellG(x, y)} rect:last-of-type`;

test.describe("分散型リバーシ", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(pageUrl.href);
		// 中央セルが表示されるまで待機
		await page.waitForSelector(cellG(0, 0));
	});

	test("ページタイトルとボードが表示される", async ({ page }) => {
		await expect(page).toHaveTitle(/分散型リバーシ/);
		await expect(page.getByRole("img", { name: "DRBoard" })).toBeVisible();
		await expect(page.locator("nav")).toBeVisible();
	});

	test.describe("初期盤面", () => {
		test("5×5=25セルが表示される", async ({ page }) => {
			await expect(page.locator("[id^='cell']")).toHaveCount(25);
		});

		test("四隅のセルが存在する", async ({ page }) => {
			for (const [x, y] of [
				[-2, -2],
				[-2, 2],
				[2, -2],
				[2, 2],
			] as [number, number][]) {
				await expect(page.locator(cellG(x, y))).toBeAttached();
			}
		});

		test("全セルが初期状態（未着色）", async ({ page }) => {
			const rects = page.locator("[id^='cell'] rect:last-of-type");
			const count = await rects.count();
			for (let i = 0; i < count; i++) {
				await expect(rects.nth(i)).not.toHaveAttribute("style", /oklch/);
			}
		});
	});

	test.describe("ゲーム操作", () => {
		test("セルをクリックすると着色される", async ({ page }) => {
			const center = page.locator(foreRect(0, 0));
			await center.click();
			// Jotai store 更新 → React 再描画を待つ
			await expect(center).toHaveAttribute("style", /oklch/, { timeout: 2000 });
		});

		test("3クリックでリバーシ反転する", async ({ page }) => {
			// player 0 が [0,2] をクリック（state=0）
			await page.locator(foreRect(0, 2)).click();
			await expect(page.locator(foreRect(0, 2))).toHaveAttribute(
				"style",
				/oklch/,
				{ timeout: 2000 },
			);
			// setShared が全セルに伝播するのを待機（4hop × 40ms ≒ 160ms）
			await page.waitForTimeout(300);
			// player 1 が [0,-2] をクリック（state=1）
			await page.locator(foreRect(0, -2)).click();
			await expect(page.locator(foreRect(0, -2))).toHaveAttribute(
				"style",
				/oklch/,
				{ timeout: 2000 },
			);
			// setShared が全セルに伝播するのを待機
			await page.waitForTimeout(300);
			// player 0 が [0,0] をクリック（state=0）
			// reversi1(state=0) が北へ走り [0,1](N≠0 → pending) → [0,2](state=0, MATCH!)
			// → reversi2(state=0) が南へ戻り [0,1] を反転
			await page.locator(foreRect(0, 0)).click();
			// [0,1] が反転して着色されているはず
			await expect(page.locator(foreRect(0, 1))).toHaveAttribute(
				"style",
				/oklch/,
				{ timeout: 2000 },
			);
		});

		test("「はじめから」ボタンで全セルがリセットされる", async ({ page }) => {
			// まずセルを着色
			await page.locator(foreRect(0, 0)).click();
			await expect(page.locator(foreRect(0, 0))).toHaveAttribute(
				"style",
				/oklch/,
				{ timeout: 2000 },
			);
			// リセット
			await page.getByText("はじめから").click();
			// 着色が消える
			await expect(page.locator(foreRect(0, 0))).not.toHaveAttribute(
				"style",
				/oklch/,
				{ timeout: 1000 },
			);
		});
	});

	test.describe("セル選択・インスペクタ", () => {
		test("右クリックでセルを選択するとインスペクタが表示される", async ({
			page,
		}) => {
			await page.locator(foreRect(0, 0)).click({ button: "right" });
			await expect(page.getByText("1個の座標を選択中")).toBeVisible();
			await expect(page.getByLabel("playerCount")).toBeVisible();
		});

		test("Shift+右クリックで複数選択できる", async ({ page }) => {
			await page.locator(foreRect(0, 0)).click({ button: "right" });
			await page
				.locator(foreRect(1, 0))
				.click({ button: "right", modifiers: ["Shift"] });
			await expect(page.getByText("2個の座標を選択中")).toBeVisible();
		});

		test("ボードの余白クリックで選択解除される", async ({ page }) => {
			await page.locator(foreRect(0, 0)).click({ button: "right" });
			await expect(page.getByText("1個の座標を選択中")).toBeVisible();
			// ボードSVGの左上隅（セルがない領域）をクリック
			// position はボード要素の左上を基準とした相対座標
			const board = page.getByRole("img", { name: "DRBoard" });
			await board.click({ position: { x: 5, y: 5 } });
			await expect(page.getByText("1個の座標を選択中")).not.toBeVisible();
		});
	});

	test.describe("UI コントロール", () => {
		test("編集モードをオン・オフできる", async ({ page }) => {
			const toggle = page.getByLabel("編集モード");
			// 初期状態: オフ
			await expect(toggle).toHaveAttribute("data-state", "0");
			await toggle.click();
			await expect(toggle).toHaveAttribute("data-state", "1");
			await toggle.click();
			await expect(toggle).toHaveAttribute("data-state", "0");
		});

		test("開発モードをオンにするとセル状態テキストが表示される", async ({
			page,
		}) => {
			await page.getByLabel("開発モード").click();
			// DRInitialState = "N" がセル内テキストとして表示される
			const cellText = page.locator(`${cellG(0, 0)} text`).first();
			await expect(cellText).toBeVisible();
			await expect(cellText).toContainText("N");
		});

		test("送信遅延・受信遅延の入力欄が表示される", async ({ page }) => {
			await expect(page.getByLabel("送信遅延 [ms]")).toBeVisible();
			await expect(page.getByLabel("受信遅延 [ms]")).toBeVisible();
		});

		test("ズームスライダーが表示される", async ({ page }) => {
			await expect(page.locator("input[type='range']")).toBeVisible();
		});
	});

	test.describe("編集モード", () => {
		test.beforeEach(async ({ page }) => {
			await page.getByLabel("編集モード").click();
			await expect(page.getByLabel("編集モード")).toHaveAttribute(
				"data-state",
				"1",
			);
		});

		test("編集モードオン時にセルをクリックすると削除される", async ({
			page,
		}) => {
			// 編集モードでは CSS により rect が pointer-events: none になるため
			// ボード SVG を直接クリックする（クリック位置はボード中央 = cell[0,0]）
			// Board.useOnClick がセルを削除するので 25→24 セルになる
			const board = page.getByRole("img", { name: "DRBoard" });
			await board.click();
			await expect(page.locator("[id^='cell']")).toHaveCount(24, {
				timeout: 1000,
			});
		});
	});
});
