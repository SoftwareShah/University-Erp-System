const test = require('node:test');
const assert = require('node:assert/strict');
const studentRoutes = require('../routes/student');
const adminRoutes = require('../routes/admin');

const routeMethods = router => router.stack
  .filter(layer => layer.route)
  .map(layer => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods),
  }));

test('student profile routes are read-only and do not allow photo changes', () => {
  const routes = routeMethods(studentRoutes);
  assert.ok(routes.some(route => route.path === '/profile' && route.methods.includes('get')));
  assert.ok(!routes.some(route => route.path === '/profile' && route.methods.some(method => ['put', 'patch', 'post', 'delete'].includes(method))));
  assert.ok(!routes.some(route => route.path.startsWith('/profile/avatar')));
});

test('administrator student management route supports profile updates', () => {
  const routes = routeMethods(adminRoutes);
  assert.ok(routes.some(route => route.path === '/students/:id' && route.methods.includes('put')));
});
