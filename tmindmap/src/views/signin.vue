<template>
  <div class="login">
    <div class="signin_form">
      <img src="../assets/img/TMIND.png" alt="Logo" class="logo" /><br />
      <input type="email" name="email" id="email" v-model="form.email" placeholder="Nhập email của bạn" /><br />
      <input type="password" name="pass" id="pass" v-model="form.pass" placeholder="Nhập mật khẩu của bạn" /><br />
      <button type="button" class="submit" @click="signin">Đăng nhập</button>
      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      <a href="#" @click.prevent="openModal">Quên mật khẩu?</a>

      <!-- Modal phục hồi mật khẩu -->
      <div v-if="isModalOpen" class="modal-overlay" style="display: flex !important; z-index: 9999;">
        <div class="modal">
          <!-- Nút đóng modal -->
          <button class="close" @click="closeModal">×</button>
          <h2>Phục hồi mật khẩu</h2>

          <!-- Bước 1: Nhập email -->
          <div v-if="step === 1">
            <p>Nhập email của bạn:</p>
            <input type="text" v-model="identifier" placeholder="Email" />
            <button @click="sendVerificationCode">Gửi mã xác thực</button>
          </div>

          <!-- Bước 2: Nhập mã xác thực -->
          <div v-if="step === 2">
            <p>Nhập mã xác thực đã nhận:</p>
            <input type="text" v-model="code" placeholder="Mã xác thực" />
            <button @click="verifyCode">Xác thực mã</button>
          </div>

          <!-- Bước 3: Nhập mật khẩu mới -->
          <div v-if="step === 3">
            <p>Nhập mật khẩu mới:</p>
            <input type="password" v-model="newPassword" placeholder="Mật khẩu mới" />
            <input type="password" v-model="confirmPassword" placeholder="Nhập lại mật khẩu" />
            <button @click="resetPassword">Đặt lại mật khẩu</button>
          </div>

          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
        </div>
      </div>

      <p>Chưa có tài khoản? <router-link to="/signup">Đăng ký ngay</router-link></p>
      <div class="login_other">
        <button class="login_gg" @click="loginWithGoogle">
          Đăng nhập với Google
          <i class="fa-brands fa-google"></i>
        </button>
        <button class="login_fb" @click="loginWithFacebook">
          Đăng nhập với Facebook
          <i class="fa-brands fa-facebook"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, googleProvider, facebookProvider, signInWithPopup } from '../firebase';
import { authState } from '../authState'; // Đảm bảo alias @ trỏ đến src

export default {
  name: "SignIn",
  data() {
    return {
      form: {
        email: '',
        pass: ''
      },
      errorMessage: '',
      // Các biến cho modal phục hồi mật khẩu (nếu có)
      isModalOpen: false,
      step: 1,
      identifier: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      userId: '',
      successMessage: '',
    }
  },
  methods: {
    async signin() {
      this.errorMessage = '';
      try {
        const response = await fetch('http://localhost:5000/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.form.email,
            pass: this.form.pass
          })
        });
        const data = await response.json();
        if (response.ok) {
          // Lưu thông tin đăng nhập vào localStorage
          localStorage.setItem('token', data.token);
          console.log(data.token);
          localStorage.setItem('userName', data.user.name);
          localStorage.setItem('userIcon', data.user.photoURL);
          localStorage.setItem('provider', 'local');
          // Cập nhật giá trị reactive
          authState.token = data.token;
          authState.userName = data.user.name;
          authState.userIcon = data.user.photoURL;
          this.$router.push('/'); // Chuyển hướng đến trang chủ
        } else {
          this.errorMessage = data.message;
        }
      } catch (error) {
        console.error(error);
        this.errorMessage = 'Đã xảy ra lỗi!';
      }
    },
    async loginWithGoogle() {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google login success', result.user);
        const user = result.user;
        const idToken = await user.getIdToken();

        // Lưu vào localStorage
        localStorage.setItem('token', idToken);
        localStorage.setItem('provider', 'google');
        localStorage.setItem('userName', user.displayName);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userIcon', user.photoURL);
        const res = await fetch('http://localhost:5000/saveUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            provider: 'google'
          })
        });
        console.log('Response from saveUser:', await res.text());
        // Update reactive authState
        authState.token = localStorage.getItem('token');
        authState.userName = localStorage.getItem('userName');
        authState.userIcon = localStorage.getItem('userIcon');
        this.$router.push('/');
      } catch (error) {
        if (error.code === 'auth/cancelled-popup-request') {
          this.errorMessage = 'Đăng nhập với Google bị hủy. Vui lòng thử lại.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          this.errorMessage = 'Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại sau.';
        } else {
          this.errorMessage = error.message;
        }
      }
    },
    async loginWithFacebook() {
      try {
        const result = await signInWithPopup(auth, facebookProvider);
        localStorage.setItem('provider', 'facebook');
        console.log('Facebook login success', result.user);
        const user = result.user;
        const idToken = await user.getIdToken();

        localStorage.setItem('token', idToken);
        localStorage.setItem('provider', 'facebook');
        localStorage.setItem('userName', user.displayName);
        localStorage.setItem('userIcon', user.photoURL);
        localStorage.setItem('userEmail', user.email);
        await fetch('http://localhost:5000/api/auth/saveUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            provider: 'facebook'
          })
        });
        // Update reactive authState
        authState.token = localStorage.getItem('token');
        authState.userName = localStorage.getItem('userName');
        authState.userIcon = localStorage.getItem('userIcon');
        this.$router.push('/');
      } catch (error) {
        if (error.code === 'auth/cancelled-popup-request') {
          this.errorMessage = 'Đăng nhập với Facebook bị hủy. Vui lòng thử lại.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          this.errorMessage = 'Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại sau.';
        } else {
          this.errorMessage = error.message;
        }
      }
    },
    // Các hàm cho modal phục hồi mật khẩu (openModal, sendVerificationCode, verifyCode, resetPassword) giữ nguyên...
    openModal() {
      this.isModalOpen = true;
      this.step = 1;
      this.identifier = '';
      this.code = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.userId = '';
      this.errorMessage = '';
      this.successMessage = '';
    },
    closeModal() {
      this.isModalOpen = false;
    },
    async sendVerificationCode() {
      this.errorMessage = '';
      try {
        const payload = { email: this.identifier };
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
          this.successMessage = data.message;
          if (data.userId) {
            this.userId = data.userId;
          }
          this.step = 2;
        } else {
          this.errorMessage = data.message;
        }
      } catch (error) {
        console.error(error);
        this.errorMessage = 'Đã xảy ra lỗi!';
      }
    },
    async verifyCode() {
      this.errorMessage = '';
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, code: this.code })
        });
        const data = await response.json();
        if (response.ok) {
          this.successMessage = data.message;
          this.step = 3;
        } else {
          this.errorMessage = data.message;
        }
      } catch (error) {
        console.error(error);
        this.errorMessage = 'Đã xảy ra lỗi!';
      }
    },
    async resetPassword() {
      this.errorMessage = '';
      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'Mật khẩu xác nhận không khớp!';
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            code: this.code,
            newPassword: this.newPassword
          })
        });
        const data = await response.json();
        if (response.ok) {
          this.successMessage = data.message;
          setTimeout(() => this.closeModal(), 2000);
        } else {
          this.errorMessage = data.message;
        }
      } catch (error) {
        console.error(error);
        this.errorMessage = 'Đã xảy ra lỗi!';
      }
    }
  }
};
</script>



<style scoped>
/* Sign in */

/* Container chính */
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #eef2f5;
  padding: 20px;
}

/* Form đăng nhập */
.signin_form {
  width: 35%;
  max-width: 400px;
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.signin_form .logo {
  width: 200px;
  margin-bottom: 20px;
}

/* Input styling */
.signin_form input {
  width: 90%;
  font-size: 16px;
  margin-bottom: 15px;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border 0.3s ease, box-shadow 0.3s ease;
}

.signin_form input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

/* Nút đăng nhập */
.submit {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(45deg, rgb(136, 136, 245), rgb(47, 47, 248), violet);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
  margin-bottom: 15px;
}

.submit:hover {
  background: linear-gradient(45deg, violet, rgb(47, 47, 248), rgb(133, 133, 252));
  transform: translateY(-2px);
}

/* Liên kết đăng ký */
.signin_form p {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
}

.signin_form p a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.signin_form a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.signin_form p a:hover {
  text-decoration: underline;
}
/* Nút đăng nhập khác (Google, Facebook) */
.login_other {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login_other button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login_gg {
  background: #db4437;
}

.login_fb {
  background: #4267B2;
}

.login_other button:hover {
  transform: translateY(-2px);
}

.login_other i {
  margin-left: 5px;
}

.error-msg {
  color: red !important;
  font-size: 14px;
  margin-top: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal container */
.modal {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  position: relative;
  text-align: center;
}

/* Nút đóng modal */
.close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.modal input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  box-sizing: border-box;
}

.modal button {
  padding: 8px 12px;
  margin-top: 10px;
  cursor: pointer;
}

.success-msg {
  color: green;
  font-size: 14px;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .signin_form {
    width: 90%;
    margin: 0 auto;
  }
}
</style>
