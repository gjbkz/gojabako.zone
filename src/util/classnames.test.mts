import * as assert from 'node:assert';
import { test } from 'node:test';
import { classnames } from './classnames.mts';

test('returns a string for className', () => {
  assert.equal(
    classnames('c1   c2 ', [' c3  c4', null, false, ' c5'], undefined),
    'c1 c2 c3 c4 c5',
  );
});
