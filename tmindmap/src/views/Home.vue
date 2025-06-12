<template>
    <div class="container">
        <div class="body">
        <p>
            Tạo và xuất
            <span id="word1" class="word">hình ảnh</span>
            <span id="word2" class="word" style="display: none;">PowerPoint</span>
            sơ đồ tư duy chỉ với một cú nhấp bằng AI <br>
            Thể hiện trí thông minh và khả năng sáng tạo với cách tự tạo sơ đồ tư duy
        </p>
        <button class="btn_design_mm">
            <router-link to="/createMM">Tạo sơ đồ tư duy</router-link>
        </button>
        <button class="btn_design_mm_ai">
            <router-link to="/createMMAI">Tạo sơ đồ tư duy AI</router-link>
        </button>
    </div>

    <div id="about">
        <img src="../assets/img/tmind.gif" alt="mindmap">
        <p>
            - Với <b>TMINDMAP</b>, nơi biến những ý tưởng, chủ đề của bạn thành sơ đồ tư duy nhanh chóng với AI.
            Nếu AI tạo mà còn thiếu sót hoặc chưa hoàn chỉnh lắm, người dùng có thể chỉnh sửa để hoàn chỉnh nhất. <br>
            - <b>TMINDMAP</b> còn giúp bạn thể hiện sự sáng tạo đỉnh cao của mình với một cái đầu thông minh để tạo
            nên những sơ đồ tư duy hoàn hảo. <br>
            - Hỗ trợ xuất ra hình ảnh hoặc PowerPoint để giúp việc thuyết trình dễ dàng hơn. <br>
            - Hy vọng <b>TMINDMAP</b> sẽ là người bạn đồng hành cho bài thuyết trình, báo cáo, bài giảng,... <br>
            - Đối tượng chính của <b>TMINDMAP</b> là giáo viên, học sinh và sinh viên. <br>
            - Nếu có bất kỳ góp ý, đánh giá nào, hãy gửi phản hồi cho chúng tôi qua trang feedback. <br>
            - Cảm ơn mọi người đã tin tưởng và sử dụng!
        </p>
    </div>

    <footer>
        <div class="footer_top">
            <div class="footer_top-left">
                <img src="../assets/img/TMIND.png" alt="TMINDMAP">
                <p>
                    Tự thiết kế với sáng tạo của chính mình hoặc <br> nhờ AI biến thành sơ đồ tư duy chỉ trong vài phút.
                </p>
            </div>
            <div class="footer_top-right">
                <h1>TÍNH NĂNG</h1>
                <ul>
                    <li>Quản lý và tìm kiếm sơ đồ tư duy đã tạo</li>
                    <li>Tự thiết kế sơ đồ tư duy</li>
                    <li>Thiết kế sơ đồ tư duy bằng AI</li>
                    <li>Xuất sơ đồ tư duy bằng hình ảnh hoặc PowerPoint</li>
                    <li>Chọn template cho sơ đồ tư duy</li>
                </ul>
            </div>
        </div>
    </footer>
    </div>
</template>

<script>
export default {
    name: "HomeMindMap",
    mounted() {
        this.startWordAnimation();
    },
    methods: {
        startWordAnimation() {
            let isFirst = true;
            setInterval(() => {
                const word1 = document.getElementById("word1");
                const word2 = document.getElementById("word2");

                if (word1 && word2) {
                    if (isFirst) {
                        word1.style.display = "none";
                        word2.style.display = "inline-block";
                        word2.classList.remove("word");
                        void word2.offsetWidth; // trigger reflow
                        word2.classList.add("word");
                    } else {
                        word2.style.display = "none";
                        word1.style.display = "inline-block";
                        word1.classList.remove("word");
                        void word1.offsetWidth;
                        word1.classList.add("word");
                    }
                    isFirst = !isFirst;
                }
            }, 3000);
        }
    }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap');
/* body */
.body p {
    font-family: "Dancing Script", cursive;
    font-size: 30px;
    margin-bottom: 50px;
    text-align: center;
    width: 100%;
}

.word {
    display: inline-block;
    position: relative;
    animation: slideDown 0.8s ease-in-out;
}

#word1 {
    color: red;
    font-weight: bolder;
}

#word2 {
    color: blue;
    font-weight: bolder;
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.btn_design_mm {
    margin-left: 35%;
    font-size: 20px;
    padding: 20px;
    font-family: "Dancing Script", cursive;
    border-radius: 20px;
    border-right: 1px solid blue;
    margin-right: 20px;
    border-left: 1px solid red;
    border-top: 1px solid blueviolet;
    border-bottom: 1px solid orange;
    background-color: rgb(200, 245, 245);
    font-weight: bolder;
}

.btn_design_mm a {
    text-decoration: none;
    color: #000;
}

.btn_design_mm:hover {
    border-right: 1px solid red;
    border-left: 1px solid blue;
    border-top: 1px solid orange;
    border-bottom: 1px solid blueviolet;
    background-color: aqua;
}

.btn_design_mm_ai:hover {
    border-right: 1px solid red;
    border-left: 1px solid blue;
    border-top: 1px solid orange;
    border-bottom: 1px solid blueviolet;
    background-color: aqua;
}

.btn_design_mm_ai {
    font-size: 20px;
    padding: 20px;
    font-weight: bolder;
    font-family: "Dancing Script", cursive;
    border-radius: 20px;
    border-right: 1px solid blue;
    border-left: 1px solid red;
    border-top: 1px solid blueviolet;
    border-bottom: 1px solid orange;
    background-color: rgb(200, 245, 245);
}

.btn_design_mm_ai a {
    text-decoration: none;
    color: #000;
}

/* ABOUT */
#about {
    margin: 20px;
    width: 100%;
}

#about img {
    width: 100%;
    max-width: 1300px;
    margin-bottom: 50px;
}

#about p {
    padding: 0 100px;
    font-size: 20px;
}
.footer_top {
    width: 100%;
    display: flex;
    margin: 100px;
}

.footer_top img {
    height: 300px;
}

.footer_top-left {
    width: 50%;
}

.footer_top-right {
    width: 50%;
    margin-right: 100px;
}

.footer_top-right h1 {
    font-size: 40px;
    text-align: center;
}

.footer_top-right li {
    font-size: 30px;
    margin-top: 20px;
    text-align: center;
    list-style-type: none;
}
@media screen and (max-width:786px) {
    /* About */
    #about img {
        width: 100%;
    }

    .btn_design_mm_ai {
        margin-left: 32%;
        margin-top: 10px;
    }

    #about {
        margin: 0;
        width: 100%;
    }

    #about p {
        padding: 15px;
    }

    /* Footer */
    footer {
        width: 100%;
    }

    .footer_top {
        width: 100%;
        display: block;
        margin: 0;
    }

    .footer_top-left {
        width: 100%;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .footer_top-right {
        width: 100%;
        margin: 15px;
    }

    .footer_top-right h1 {
        font-size: 30px;
    }

    .footer_top-right ul>li {
        font-size: 20px;
    }
}
</style>
