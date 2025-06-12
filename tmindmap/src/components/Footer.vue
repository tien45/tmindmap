<template>
    <footer>
        <div class="footer_bottom">© 2025 Copyright of TMIND MAP</div>
    </footer>
</template>
<script>
    export default {
        name: "AppFooter"
    };
</script>

<style scoped>
.footer_bottom {
    width: 100%;
    text-align: center;
    background-color: #ddd;
}
@media screen and (max-width:768px){
    footer {
        width: 100%;
    }
}
</style>