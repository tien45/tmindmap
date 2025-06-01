<template>
  <header>
    <div class="nav">
      <div class="logo">
        <router-link to="/"><img src="../assets/img/TMIND.png" alt="logo" /></router-link>
      </div>
      <div class="list" id="navList">
        <div class="list_mm">
          <a href="#" @click.prevent="goToListMindMap">LIST MINDMAP</a>
        </div>
        <div class="about">
          <router-link to="/#about">ABOUT</router-link>
        </div>
        <div class="feedback">
          <a href="#" @click.prevent="openModal">FEEDBACK</a>
        </div>
        <!-- Nếu chưa đăng nhập -->
        <div class="signin" v-if="!isLoggedIn">
          <router-link to="/signin">SIGN IN</router-link>
        </div>
        <div class="signup" v-if="!isLoggedIn">
          <router-link to="/signup">SIGN UP</router-link>
        </div>
        <!-- Nếu đã đăng nhập: hiển thị thông tin user -->
        <div class="user-info" v-if="isLoggedIn" @click="toggleUserMenu">
          <img :src="userIcon" alt="User Icon" class="user-icon" />
          <span class="user-name">{{ userName }}</span>
        </div>
        <!-- Dropdown menu hiển thị khi bấm vào user-info -->
        <div class="user-menu" v-if="showUserMenu">
          <button @click="openAccountModal">Thông tin tài khoản</button>
          <button @click="logout">Đăng xuất</button>
        </div>
      </div>
      <button class="menu" @click="openMenu">
        <i class="fa-solid fa-bars"></i>
      </button>
      <button class="close_menu" @click="closeMenu">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </header>

  <!-- Các modal nếu có (Feedback, Account) -->
  <div class="modal-overlay" id="feedbackModal">
    <!-- Nội dung modal Feedback -->
    <div class="modal-content">
      <div class="modal-header">
        <h2>Gửi Phản Hồi</h2>
        <span class="close-button" @click="closeModal">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="Feedback">
          <div class="form-group">
            <label for="description">Mô Tả</label>
            <textarea id="description" v-model="feedbackDescription" name="description" placeholder="Mô tả chi tiết vấn đề ở đây"></textarea>
          </div>
          <div class="form-group checkbox-group">
            <input type="checkbox" id="include-ai-session" v-model="includeAiSession" name="include-ai-session" checked />
            <label for="include-ai-session">Bao gồm phiên làm việc ứng dụng cuối cùng trong phản hồi.</label>
          </div>
          <button type="submit" class="submit-button" @click="sendFeedback">Gửi đi</button>
        </form>
        <p class="footer-text">
          Để có câu trả lời nhanh chóng, hãy liên hệ với chúng tôi qua
          <a href="mailto:dtc21h4802010284@ictu.edu.vn">dtc21h4802010284@ictu.edu.vn</a>
        </p>
      </div>
    </div>
  </div>

  <div class="modal-overlay" v-if="isAccountModalOpen" style="display: flex !important; z-index: 9999;">
    <!-- Nội dung modal Account Info -->
    <div class="modal-content">
      <div class="modal-header">
        <h2>THÔNG TIN TÀI KHOẢN</h2>
        <span class="close-button" @click="closeAccountModal">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveAccountInfo">
          <div class="form-group infor">
            <label for="accountName">Tên:</label>
            <input type="text" id="accountName" v-model="account.name" placeholder="Nhập tên" />
          </div>
          <div class="form-group infor">
            <label for="accountEmail">Email:</label>
            <input type="email" id="accountEmail" v-model="account.email" placeholder="Nhập email" disabled />
          </div>
          <div class="form-group infor">
            <label for="accountPhone">Số điện thoại:</label>
            <input type="text" id="accountPhone" v-model="account.phone" placeholder="Nhập số điện thoại" />
          </div>
          <button type="submit" class="submit-button">Lưu thông tin</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { authState } from '@/authState';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase' ;
export default {
  name: "AppHeader",
  computed: {
    isLoggedIn() {
      return !!authState.token;
    },
    userName() {
      return authState.userName || "User";
    },
    userIcon() {
      return authState.userIcon || require('../assets/img/user-login.jpg');
    }
  },
  data() {
    return {
      showUserMenu: false,
      isAccountModalOpen: false,
      account: {
        name: '',
        email: '',
        phone: ''
      },
      feedbackDescription: '',
      includeAiSession: true
    }
  },
  methods: {
    goToListMindMap() {
      if (!this.isLoggedIn) {
        this.$router.push('/signin');
      } else {
        this.$router.push('/listmm');
      }
    },
    openModal() {
      if (!this.isLoggedIn) {
        this.$router.push('/signin');
      } else {
        document.getElementById('feedbackModal').style.display = 'flex';
      }
    },
    closeModal() {
      document.getElementById('feedbackModal').style.display = 'none';
    },
    Feedback() {
      if (!this.isLoggedIn) {
        this.$router.push('/signin');
      } else {
        console.log("Feedback gửi:", this.feedbackDescription, this.includeAiSession);
        this.closeModal();
      }
    },
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    async openAccountModal() {
  try {
    // 1) Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Chưa có token, vui lòng đăng nhập lại');
    }
    console.log('Using token:', token);

    // 2) Gọi API /profile với header Bearer
    const res = await fetch('http://localhost:5000/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
      // → bỏ credentials hoàn toàn
    });

    // 3) Check status
    if (res.status === 401) {
      // nếu token hết hạn hoặc invalid
      this.$router.push('/signin');
      return;
    }
    if (!res.ok) {
      throw new Error(`Unexpected status ${res.status}`);
    }

    // 4) Parse và set data
    const data = await res.json();
    const user = data.user ?? data;
    this.account = {
      name: user.name,
      email: user.email,
      phone: user.phone
    };
    this.isAccountModalOpen = true;

  } catch (err) {
    console.error('Failed to open account modal:', err);
  }
},
    closeAccountModal() {
      this.isAccountModalOpen = false;
    },
    async saveAccountInfo() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: this.account.name,
            phone: this.account.phone
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || `Error ${res.status}`);
        }

        const { user } = await res.json();
        // Đồng bộ lại dữ liệu hiển thị nếu cần
        this.account.name = user.name;
        this.account.phone = user.phone;

        this.isAccountModalOpen = false;
        alert('Cập nhật thành công!')

      } catch (err) {
        console.error('Save profile failed:', err);
      }
    },
    async logout() {
    try {
      // 1. Sign out khỏi Firebase
      await signOut(auth);
      authState.token = null;
      authState.userName = "";
      authState.userIcon = "";
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("userIcon");
      // 4. Redirect
      this.$router.push('/signin');
      this.showUserMenu = false;
    } catch (err) {
      console.error('Logout lỗi:', err);
    }
  },
    openMenu() {
      if (window.innerWidth <= 768) {
        document.querySelector('.list').style.display = 'block';
        document.querySelector('.close_menu').style.display = 'block';
        document.querySelector('.menu').style.display = 'none';
      }
    },
    closeMenu() {
      if (window.innerWidth <= 768) {
        document.querySelector('.list').style.display = 'none';
        document.querySelector('.close_menu').style.display = 'none';
        document.querySelector('.menu').style.display = 'block';
      }
    },
    sendFeedback() {
  const payload = {
    name: localStorage.getItem('userName') || "Anonymous",
    email: localStorage.getItem('userEmail') || "unknown@example.com",
    content: this.feedbackDescription
  };

  fetch('http://localhost:5000/feedback', {
    method: 'POST',
    headers: { // <-- sửa ở đây: 'headers' thay vì 'header'
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Server response was not OK");
      }
      alert('Đã gửi phản hồi thành công')
      return res.json();
    })
    .then(data => {
      console.log("Feedback gửi:", data);
      this.successMessage = data.message;
      setTimeout(() => this.closeModal(), 2000);
    })
    .catch(err => {
      console.error("Lỗi khi gửi feedback:", err);
      this.errorMessage = "Lỗi khi gửi phản hồi!";
    });
}
  },
  mounted() {
    window.addEventListener('resize', () => {
      const navList = document.querySelector('.list');
      if (window.innerWidth > 768) {
        navList.style.display = 'flex';
        document.querySelector('.menu').style.display = 'none';
      } else {
        navList.style.display = 'none';
        document.querySelector('.menu').style.display = 'block';
      }
    });
  }
};
</script>




<style scoped>
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
header {
  height: 90px;
  width: 100%;
}
.nav {
  margin-left: 30px;
  border-radius: 10px;
  display: flex;
  padding: 20px;
  width: 100%;
  background-color: rgba(255,255,255,0.05);
  height: 100px;
  z-index: 1;
}
.list {
  display: flex;
  width: 60%;
}
.list a {
  text-decoration: none;
  display: block;
  margin-right: 40px;
  color: black;
  margin-top: 10px;
  font-weight: bolder;
  padding: 10px;
}
.list a:hover {
  background-color: #000;
  color: #fff;
  border-radius: 10px;
}
.signup a {
  background-color: #000;
  color: #fff;
  border-radius: 10px;
}
.logo {
  width: 45%;
  margin-left: 40px;
}
.logo img {
  height: 50px;
}
.menu, .close_menu {
  display: none;
  padding: 5px;
  background-color: #fff;
  border: none;
  font-size: 25px;
  margin-left: 50%;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  display: none; /* Ẩn modal mặc định */
  z-index: 1;
}
.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: block;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  text-align: center;
  padding-left: 60px;
}
.modal-header h2 {
  font-size: 18px;
  font-weight: bolder;
}
.close-button {
  cursor: pointer;
  font-size: 20px;
  font-weight: bolder;
}
.form-group {
  margin-bottom: 16px;
}
.infor{
  display:flex;
  justify-content: space-between;
  align-items: center;
}
.infor input{
  width: 250px;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px;
  font-size: 14px;
}
.form-group textarea {
  height: 80px;
  resize: vertical;
}
.checkbox-group {
  display: flex;
  align-items: center;
}
.checkbox-group input[type="checkbox"] {
  margin-right: 6px;
  transform: scale(1.2);
}
.submit-button {
  width: 100%;
  background: linear-gradient(to right, #6366F1, #7C3AED);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 10px;
}
.submit-button:hover {
  opacity: 0.9;
}
.footer-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
.footer-text a {
  color: #6366F1;
  text-decoration: none;
}
.footer-text a:hover {
  text-decoration: underline;
}
.user-info {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 5px;
  cursor: pointer;
}
.user-info .user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 8px;
}
.user-info .user-name {
  font-weight: bold;
  color: #333;
}
.user-menu {
  position: absolute;
  top: 80px;
  right: 100px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 2;
}
.user-menu button {
  display: block;
  width: 100%;
  border: none;
  border-bottom: 1px solid #666;
  background: none;
  padding: 10px;
  text-align: left;
  cursor: pointer;
}
.user-menu button:hover {
  background-color: #f0f0f0;
}
@media screen and (max-width: 768px) {
  .signin_form {
    width: 90%;
    margin: 0 auto;
  }
  .list {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 100px;
    left: 0;
    right: 0;
    width: 100%;
    margin-left: 0;
    background-color: white;
    border: 1px solid #000;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    border-top: 1px solid #fff;
    box-shadow: 10px 10px #ddd;
  }
  .list a {
    display: block;
    margin-left: 50px;
    margin-bottom: 20px;
    text-align: center;
  }
  .nav .logo {
    margin: 0;
  }
  .nav {
    max-width: 95%;
    margin-top: 5px;
    margin-left: 5px;
  }
  .menu {
    display: block;
    padding: 5px;
    background-color: #fff;
    border: none;
    margin-left: 50%;
    font-size: 25px;
  }
  .close_menu {
    display: none;
    padding: 5px;
    background-color: #fff;
    border: none;
    font-size: 25px;
    margin-left: 50%;
  }
  .modal-overlay {
    width: 100%;
  }
  .modal-content {
    width: 90%;
  }
}
</style>
