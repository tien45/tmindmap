// src/composables/authState.js
import { reactive } from 'vue';

export const authState = reactive({
    token: localStorage.getItem('token') || '',
    userName: localStorage.getItem('userName') || '',
    userIcon: localStorage.getItem('userIcon') || ''
});
