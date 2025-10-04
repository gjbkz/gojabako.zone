import type { StoryObj } from "@storybook/react";
import * as g1 from "../Button/index.stories.tsx";
import * as g2 from "../CryptoKey/index.stories.tsx";
import * as g3 from "../DataViewer/index.stories.tsx";
import * as g4 from "../LogSlider/index.stories.tsx";
import * as g5 from "../StoryView/index.stories.tsx";
import * as g6 from "../Toggle/index.stories.tsx";
import * as g7 from "../ZoomSlider/index.stories.tsx";

type Stories = Record<string, StoryObj>;
export const storyGroups = new Map<string, Stories>();
storyGroups.set("Button", g1 as Stories);
storyGroups.set("CryptoKey", g2 as Stories);
storyGroups.set("DataViewer", g3 as Stories);
storyGroups.set("LogSlider", g4 as Stories);
storyGroups.set("StoryView", g5 as Stories);
storyGroups.set("Toggle", g6 as Stories);
storyGroups.set("ZoomSlider", g7 as Stories);
