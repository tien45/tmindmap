import { createRouter, createWebHistory } from 'vue-router';
import Home from './src/views/Home.vue'
import listmm from './src/views/listmm.vue';
import createmm from './src/views/createmm.vue';
import createmmAI from './src/views/createmmAI.vue';
import signin from './src/views/signin.vue';
import signup from './src/views/signup.vue';

const routes = [
    { path: '/', component: Home },
    { path: '/listmm', component: listmm },
    { path: '/createmm', component: createmm },
    { path: '/createmm/edit/:id', component: createmm, props: true },
    { path: '/createmmAI', component: createmmAI },
    { path: '/signin', component: signin },
    { path: '/signup', component: signup }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});
router.beforeEach((to, from, next) => {
    const publicPages = ['/', '/createMM', '/signin', '/signup'];
    const authRequired = !publicPages.includes(to.path);
    const token = localStorage.getItem('token');
    if (authRequired && !token) {
        return next('/signin');
    }
    next();
})
export default router;