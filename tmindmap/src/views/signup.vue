<template>
    <div class="login">
        <div class="signin_form">
            <img src="../assets/img/TMIND.png" alt="Logo" class="logo"><br>
            <input type="text" name="name" id="name" v-model="form.name" placeholder="Nhập họ và tên">
            <input type="tel" name="phone" id="phone" v-model="form.phone" placeholder="Nhập số điện thoại">
            <input type="email" name="email" id="email" v-model="form.email" placeholder="Nhập email của bạn"><br>
            <input type="password" name="pass" id="pass" v-model="form.pass" placeholder="Nhập mật khẩu của bạn"><br>
            <input type="password" name="confirmPass" id="confirmPass" v-model="form.confirmPass" placeholder="Nhập lại mật khẩu"><br>
            <button type="button" class="submit" @click.prevent="signup">Đăng Ký</button>
            <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
            <p>Đã có tài khoản? <a href="/signin">Đăng nhập ngay</a></p>
            <div class="login_other">
                <button class="login_gg" @click="loginWithGoogle">
                    Google
                    <i class="fa-brands fa-google"></i>
                </button>
                <button class="login_fb" @click="loginWithFacebook">Facebook <i class="fa-brands fa-facebook"></i></button>
            </div>
        </div>
    </div>
</template>
<script>
import { auth, googleProvider, facebookProvider, signInWithPopup } from '../firebase';
export default{
    name:"SignUp",
    data() {
    return {
      form: {
        name: '',
        phone: '',
        email: '',
        pass: '',
        confirmPass: ''
      },
      errorMessage: ''
    }
  },
  methods: {
    async signup() {
      try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.form.name,
            phone: this.form.phone,
            email: this.form.email,
            pass: this.form.pass,
            confirmPass: this.form.confirmPass
          })
        });
        const data = await response.json();
        if(response.ok){
          alert(data.message);
          // Chuyển hướng nếu cần, ví dụ:
          this.$router.push('/signin');
        } else {
          if (response.ok) {
              this.errorMessage = ''; // xóa lỗi nếu đăng ký thành công
              this.$router.push('/signin');
          } else {
              this.errorMessage = data.message; // hiển thị lỗi
          }
          console.log(this.form);
        }
      } catch (error) {
        console.error(error);
        alert('Đã xảy ra lỗi!');
      }
    },
    async loginWithGoogle(){
      try{
        const result = await signInWithPopup(auth,googleProvider);
        console.log('Google login success',result.user);
      }catch(error){
        if(error.code==='auth/cancelled-popup-request'){
          this.errorMessage = 'Đăng nhập băng Google bị hủy. Vui lòng thử lại.';
        }else if(error.code==='auth/popup-closed-by-user'){
          this.errorMessage='Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại sau.';
        }else{
          this.errorMessage = error.message;
        }
      }
    },
    async loginWithFacebook(){
      try{
        const result = await signInWithPopup(auth,facebookProvider);
        console.log('Facebook login success',result.user);
      }catch(error){
        if(error.code==='auth/cancelled-popup-request'){
          this.errorMessage = 'Đăng nhập băng Facebook bị hủy. Vui lòng thử lại.';
        }else if(error.code==='auth/popup-closed-by-user'){
          this.errorMessage='Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại sau.';
        }else{
          this.errorMessage = error.message;
        }
      }
    }
  }
}
</script>
<style scoped>
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
.login_other i{
    margin-left: 5px;
}
.error-msg {
  color: red !important;
  font-size: 14px;
  margin-top: -10px;
  margin-bottom: 10px;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .signin_form {
    width: 90%;
    margin: 0 auto;
  }
}

</style>