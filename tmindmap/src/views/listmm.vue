<template>
  <div>
    <!-- Toolbar -->
    <div class="toollist">
      <div class="toolbar_list-left">
        <router-link to="/createMM">
          <button class="btn-primary">
            <span>&#171;</span> Tự tạo sơ đồ tư duy
          </button>
        </router-link>
      </div>
      <div class="search_list">
        <input
          v-model="searchTerm"
          @input="filterList"
          type="text"
          placeholder="Nhập tên sơ đồ tư duy cần tìm..."
        />
        <button class="btn-search" @click="filterList">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
      <div class="toolbar_list-right">
        <router-link to="/createMMAI">
          <button class="btn-secondary">
            Tạo sơ đồ tư duy AI <span>&#187;</span>
          </button>
        </router-link>
      </div>
    </div>

    <!-- Danh sách mindmap -->
    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else>
      <div
        v-for="item in filteredList"
        :key="item._id"
        class="listmm"
      >
      <router-link :to="`/createmm/edit/${item._id}`" class="itemmm">
        <img :src="item.imageUrl" alt="Mindmap" />
        <div class="listmm-content">
          <h3 class="title">{{ item.title }}</h3>
          <small>Ngày tạo: {{ formatDate(item.createdAt) }}</small>
        </div>
      </router-link>
        <div class="list_delete" @click="deleteItem(item._id)">
          <i class="fa-solid fa-trash"></i>
        </div>
      </div>
      <div v-if="!filteredList.length" class="no-data">
        Không tìm thấy sơ đồ tư duy.
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth } from 'firebase/auth';

export default {
  name: "MindMapList",
  data() {
    return {
      list: [],         // toàn bộ mindmaps
      filteredList: [], // đã filter
      searchTerm: "",
      loading: false
    };
  },
  mounted() {
    this.fetchList();
  },
  methods: {
    // 1) Lấy danh sách mindmap
    async fetchList() {
  this.loading = true;
  try {
    let token;

    // 1. Kiểm tra loại provider đã lưu
    const provider = localStorage.getItem('provider'); // 'google' hay 'custom'
    console.log(provider)
    if (provider === 'google') {
      // Firebase-authenticated user
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Chưa đăng nhập Firebase');
      token = await user.getIdToken(/* forceRefresh= */ true);
    } else {
      // Custom-authenticated user
      token = localStorage.getItem('token');
      if (!token) throw new Error('Chưa đăng nhập hệ thống');
    }

    // 2. Gọi API chung
    const res = await fetch("http://localhost:5000/api/listMindmap/Listmm", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.status === 401) {
      throw new Error('Không có quyền hoặc token hết hạn');
    }
    if (!res.ok) {
      throw new Error(await res.text());
    }

    // 3. Nhận và gán dữ liệu
    const { list } = await res.json();
    this.list = list;
    this.filteredList = list;

  } catch (e) {
    alert("Lỗi khi tải danh sách: " + e.message);
  } finally {
    this.loading = false;
  }
},

    // 2) Filter theo searchTerm
    filterList() {
      const term = this.searchTerm.trim().toLowerCase();
      if (!term) {
        this.filteredList = this.list;
      } else {
        this.filteredList = this.list.filter(item =>
          item.title.toLowerCase().includes(term)
        );
      }
    },

    // 3) Xóa mindmap
    async deleteItem(id) {
      if (!confirm("Bạn có chắc muốn xóa sơ đồ này?")) return;
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Chưa đăng nhập');
        const token = await user.getIdToken(true);
        const res = await fetch(
          `http://localhost:5000/api/listMindmap/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!res.ok) throw new Error(await res.text());
        // Cập nhật lại danh sách sau khi xóa
        this.list = this.list.filter(i => i._id !== id);
        this.filterList();
      } catch (e) {
        alert("Lỗi khi xóa: " + e.message);
      }
    },

    // 4) Định dạng ngày tháng
    formatDate(iso) {
      const d = new Date(iso);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
  }
};
</script>

  
  <style scoped>
  /* Tổng thể */
  body {
    font-family: 'Roboto', sans-serif;
  }
  
  /* Thanh công cụ */
  .toollist {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgb(77, 70, 70), aqua);
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }
  
  .toolbar_list-left,
  .toolbar_list-right {
    display: flex;
    align-items: center;
  }
  
  /* Nút bấm */
  .btn-primary,
  .btn-secondary {
    padding: 8px 16px;
    border: 1px solid #007bff;
    border-radius: 8px;
    background-color: #007bff;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  
  .btn-secondary {
    background-color: #28a745;
    border-color: #28a745;
  }
  
  .btn-primary:hover,
  .btn-secondary:hover {
    background-color: #28a745;
    transform: translateY(-2px);
  }
  
  .btn-search {
    padding: 8px 12px;
    background-color: aqua;
    color:#fff;
    border: 2px solid #ccc;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .btn-search i{
    font-size: 20px;
  }
  .btn-search:hover {
    background-color: rgb(6, 141, 146);
  }
  
  /* Thanh tìm kiếm */
  .search_list {
    display: flex;
    align-items: center;
    flex: 1;
    margin: 0 20px;
  }
  
  .search_list input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 8px 0 0 8px;
    outline: none;
    transition: border 0.3s ease;
  }
  
  .search_list input:focus {
    border-color: #007bff;
  }
  
  .search_list .btn-search {
    border-radius: 0 8px 8px 0;
  }
  
  /* Danh sách sơ đồ tư duy */
  .listmm {
    display: flex;
    align-items: center;
    background-color: #ddd;
    border: 1px solid #010;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 5px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    transition: box-shadow 0.3s ease;
  }
  .itemmm{
    width:95%;
    display:flex;
    text-decoration: none;
  }
  .listmm:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    background-color: #fff;
  }
  
  .listmm img {
    width: 20%;
    min-width: 120px;
    border-radius: 8px;
    margin-right: 15px;
  }
  
  .listmm-content {
    flex: 1;
  }
  
  .listmm .title {
    font-size: 18px;
    margin: 0;
    color: #333;
  }
  
  .list_delete {
    padding-left: 20px;
    cursor: pointer;
    transition: color 0.3s ease, transform 0.2s ease;
  }
  
  .list_delete i {
    font-size: 26px;
    color: #888;
  }
  
  .list_delete i:hover {
    color: #d9534f;
    transform: scale(1.1);
  }
  .loading {
  text-align: center;
  margin: 20px 0;
  color: #555;
}
.no-data {
  text-align: center;
  margin: 20px 0;
  color: #999;
}
  /* Responsive */
  @media screen and (max-width: 768px) {
    .toollist {
      flex-direction: column;
      align-items: stretch;
    }
    
    .toolbar_list-left,
    .toolbar_list-right {
      justify-content: center;
      margin-bottom: 10px;
      width: 100%;
    }
    .toolbar_list-left .btn-primary{
        align-items: start;
        justify-content: center;
        margin-right: 350px;
    }
    .toolbar_list-right .btn-secondary{
        align-items: end;
        justify-content: center;
        margin-left: 350px;
    }
    .search_list {
      margin: 10px 0;
    }
    
    .listmm {
      min-width: 280px;
    }
    
    .listmm img {
      width: 30%;
      min-width: 80px;
      margin-right: 10px;
    }
    
    .list_delete {
      align-self: flex-end;
      padding: 10px 0 0 0;
    }
  }
  </style>
  