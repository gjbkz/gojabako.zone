import type { StoryObj } from '@storybook/react';
import * as g1 from '../Button/index.stories';
import * as g2 from '../CryptoKey/index.stories';
import * as g3 from '../DataView/index.stories';
import * as g4 from '../LogSlider/index.stories';
import * as g5 from '../Select/index.stories';
import * as g6 from '../StoryElement/index.stories';
import * as g7 from '../ZoomSlider/index.stories';
type Stories = Record<string, StoryObj>;
export const storyGroups = new Map<string, Stories>();
storyGroups.set('Button', g1 as Stories);
storyGroups.set('CryptoKey', g2 as Stories);
storyGroups.set('DataView', g3 as Stories);
storyGroups.set('LogSlider', g4 as Stories);
storyGroups.set('Select', g5 as Stories);
storyGroups.set('StoryElement', g6 as Stories);
storyGroups.set('ZoomSlider', g7 as Stories);
