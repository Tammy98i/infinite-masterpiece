import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { WebinarRegistrationState } from './WebinarRegistrationState';

const renderState = (ready: boolean, ended: boolean, enabled: boolean) => renderToStaticMarkup(
  <MemoryRouter><WebinarRegistrationState ready={ready} ended={ended} enabled={enabled}>
    <form data-registration="open"><button>הרשמה</button></form>
  </WebinarRegistrationState></MemoryRouter>
);

test('loading never mounts the registration form', () => {
  assert.doesNotMatch(renderState(false, false, true), /<form/);
  assert.match(renderState(false, false, true), /role="status"/);
});
test('ended event directs to existing continuation plans, not expired registration', () => {
  const html = renderState(true, true, true);
  assert.doesNotMatch(html, /<form/);
  assert.match(html, /href="\/#pricing"/);
  assert.match(html, /ההרשמה לערב הזה נסגרה/);
});
test('disabled event does not mount registration', () => {
  assert.doesNotMatch(renderState(true, false, false), /<form/);
  assert.match(renderState(true, false, false), /ההרשמה אינה פתוחה/);
});
test('upcoming or live enabled event retains its form', () => {
  assert.match(renderState(true, false, true), /data-registration="open"/);
});
