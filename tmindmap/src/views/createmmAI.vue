<template>
  <div class="AI">
    <div class="toolbarAI">
      <div class="toolbarAI_left">
        <button><a href="./CreateMM"><span>&#171;</span> Tự tạo sơ đồ tư duy</a></button>
        <button @click="toggleSuggestions"><i class="fa-solid fa-lightbulb"></i> Gợi ý</button>
      </div>
      <div class="toolbarAI_right">
        <label class="map-type-select">
          <select v-model="selectedMapType">
            <option value="bubble">Bubble Map</option>
            <option value="tree">Tree Map</option>
            <option value="flow">Flow Map</option>
            <option value="multiFlow">Multi Flow Map</option>
            <option value="brace">Brace Map</option>
          </select>
        </label>
        <button @click="saveTemplate" :disabled="!canSave"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        <button @click="exportImage"><i class="fa-solid fa-image"></i> Xuất hình ảnh</button>
        <button @click="exportPPT" :disabled="!mindmapObject"><i class="fa-solid fa-file-powerpoint"></i> Xuất PowerPoint</button>
      </div>
    </div>
    <div class="panel">
      <div class="left-panel" :class="{ hidden: !showSuggestion }">
        <h3>Gợi ý sơ đồ tư duy</h3>
        <ul class="suggetion-list">
          <li v-for="item in suggestions" :key="item._id" class="suggestion-item">
            <button @click="selectTemplate(item)">
              <img :src="item.imageUrl" alt="template thumbnail" class="thumb">
              <span class="title">{{ item.title }}</span>
            </button>
          </li>
        </ul>
      </div>
      <div class="right-panel" :class="{ full: !showSuggestions }">
        <div class="mindmap-display">
          <svg v-show="!selectedImageUrl" ref="mindmapSvg" class="mindmap-svg"></svg>
          <img v-show="selectedImageUrl" :src="selectedImageUrl" class="mindmap-image" />
        </div>
        <div class="input-container">
          <div v-if="creatingTopic" class="creating-status">
            Đang tạo sơ đồ tư duy cho <strong>{{ creatingTopic }}</strong>…
          </div>
          <template v-else>
            <input
              type="text"
              v-model="topic"
              placeholder="Nhập chủ đề hoặc ý tưởng..."
              @keypress.enter="generateMindMap"
            />
            <select v-model="selectOption" class="option-select">
              <option value="no-image">Không kèm ảnh</option>
              <option value="with-image">Kèm ảnh</option>
            </select>
            <button class="create-btn" @click="generateMindMap">
              <i class="fa-solid fa-brain"></i> Tạo sơ đồ
            </button>
            <label class="file-upload">
              <span><i class="fa-solid fa-file-arrow-up"></i></span>
              <input type="file" @change="onFileChange" />
            </label>
          </template>
        </div>
      </div>
    </div>
    <div v-if="showSaveModal" class="modal-backdrop">
      <div class="modal">
        <h3>Đặt tên sơ đồ tư duy</h3>
        <input v-model="form.mapTitle" placeholder="Tên sơ đồ tư duy" />
        <div class="modal-actions">
          <button @click="confirmSave">Lưu</button>
          <button @click="showSaveModal = false">Huỷ</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
// eslint-disable-next-line no-unused-vars
import { toRaw } from 'vue';
import * as d3 from 'd3';
import { saveSvgAsPng } from 'save-svg-as-png';
export default {
  name: 'CreateAIMindMap',
  props: {
    showSuggestions: { type: Boolean, default: true },
  },
  data() {
    return {
      topic: '',
      fileContent: null,
      mindmapObject: null,
      suggestions: [],
      showSuggestion: true,
      selectOption: 'no-image',
      selectedImageUrl: null,
      showSaveModal: false,
      form: { mapTitle: '' },
      selectedMapType: 'tree',
      leafImages: {},
      file:null,
      creatingTopic: '',
      nodes: [],   // mảng các node hiện tại
      links: [],
    };
  },
  watch: {
    mindmapObject(newVal) {
      if (newVal) this.drawMindMap();
    }
  },
  computed: {
    canSave() {
      return !!(this.selectedImageUrl || this.mindmapObject)
    }
  },
  mounted() {
    this.fetchSuggestions();
  },
  methods: {
    selectTemplate(item) {
    console.log('selected item =', item);
    this.mindmapObject   = item.mindmapData;
    this.selectedMapType = item.mapType;
    this.$nextTick(() => {
      console.log('Drawing', this.selectedMapType, this.mindmapObject);
      this.drawMindMap();
    });
  },
  async fetchSuggestions() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/listMindmap', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(res.statusText);
        const payload = await res.json();
        this.suggestions = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload.list) ? payload.list : []);
      } catch (err) {
        console.error('Lấy gợi ý thất bại:', err);
      }
    },
    toggleSuggestions() {
      this.selectedImageUrl = null;
      this.showSuggestion = !this.showSuggestion;
    },
    onFileChange(event) {
      this.file = event.target.files[0] || null;
    },

    // Gửi lên backend qua FormData
    async generateMindMap() {
      if (this.creatingTopic) return
      const label = this.file ? this.file.name : this.topic.trim()
      if (!label) return alert('Nhập chủ đề hoặc chọn file')
      this.creatingTopic = label
      const form = new FormData()
      form.append('topic', label)
      form.append('withImage', this.selectOption === 'with-image')
      if (this.file) form.append('file', this.file)
      try {
        const res = await fetch('/api/generateMindmap', { method: 'POST', body: form })
        const data = await res.json()
        this.mindmapObject = data.mindmap
        this.drawMindMap()
        this.topic = ''
        // nếu API trả sẵn ảnh
        if (data.image) {
          this.selectedImageUrl = data.image
        }
      } catch (err) {
        alert('Có lỗi khi tạo sơ đồ')
      } finally {
        this.creatingTopic = ''
      }
    },

// Hàm phụ để chuyển SVG → PNG và gán vào selectedImageUrl
_generateImageFromSvg() {
  const svgEl = this.$refs.mindmapSvg;
    // clone để không làm thay đổi DOM thật
    const clone = svgEl.cloneNode(true);
    // đảm bảo namespace
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    // chèn rect làm nền trắng
    const ns = 'http://www.w3.org/2000/svg';
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('x', 0);
    bg.setAttribute('y', 0);
    bg.setAttribute('width', w);
    bg.setAttribute('height', h);
    bg.setAttribute('fill', '#fff');
    clone.insertBefore(bg, clone.firstChild);

    // serialize
    const xml = new XMLSerializer().serializeToString(clone);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));

    // tạo image & canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + svg64;
    });
    },
  saveTemplate() {
    if (!this.canSave) return
      this.showSaveModal = true
      this.form.mapTitle = ''
    },
    async confirmSave() {
      const title = this.form.mapTitle.trim();
  if (!title) return alert('Nhập tên sơ đồ tư duy');

  // 1) Nếu chưa có ảnh, tạo từ SVG
  if (!this.selectedImageUrl) {
    // Chờ Vue cập nhật DOM (SVG vừa vẽ xong)
    await this.$nextTick();

    try {
      this.selectedImageUrl = await this._generateImageFromSvg();
    } catch (e) {
      console.error('Chuyển SVG → ảnh thất bại:', e);
      return alert('Không thể tạo ảnh từ SVG!');
    }
  }

  // 2) Gửi lên server
  await this._postSave(title);
    },
    async _postSave(title) {
  try {
    const token = localStorage.getItem('token');

    // 1. Chuẩn hoá mindmapData (tree JSON) và loại bỏ reactivity
    const cleanTree = JSON.parse(JSON.stringify(toRaw(this.mindmapObject)));

    // 2. Đóng gói payload theo schema
    const payload = {
      title,                       // tiêu đề sơ đồ
      type: 'ai',                  // đánh dấu AI‐generated
      mapType: this.selectedMapType, // 'bubble'|'tree'|'flow'|'multiFlow'|'brace'
      mindmapData: cleanTree,      // JSON gốc do AI trả về (có thể chứa root/branches/subBranches)
      imageUrl: this.selectedImageUrl // nếu bạn vẫn dùng thumbnail
    };

    // 3. Gọi API
    const resp = await fetch('/api/listMindmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Lưu thất bại');
    }

    alert('Lưu thành công');
    this.showSaveModal = false;

  } catch (e) {
    alert('Lỗi khi lưu: ' + e.message);
  }
}, 

    inlineAllStyles(el) {
    const recurse = node => {
      const cs = getComputedStyle(node);
      ['fill','stroke','font-size','font-family','font-weight','opacity']
        .forEach(prop => node.style.setProperty(prop, cs.getPropertyValue(prop)));
      for (let c of node.children) recurse(c);
    };
    recurse(el);
  },

  exportImage() {
    const svgEl = this.$refs.mindmapSvg;
    if (!svgEl) return;
    // 1) Gắn width/height nếu thiếu:
    svgEl.setAttribute('width', svgEl.clientWidth + 1000);
    svgEl.setAttribute('height', svgEl.clientHeight + 400);
    // 2) Inline styles:
    this.inlineAllStyles(svgEl);
    // 3) Xuất bằng save-svg-as-png:
    saveSvgAsPng(svgEl, (this.form.mapTitle||'mindmap')+'.png', {
      backgroundColor: 'white',
      scale: 2
    });
  },
  async exportPPT() {
      try {
        const data = this.mindmapObject;
        if (!data || typeof data.root !== 'string' || !Array.isArray(data.branches)) {
          return alert('Dữ liệu sơ đồ không đúng định dạng!');
        }
        const pptx = new window.PptxGenJS();
        
        // Slide 1: root title
        let slide = pptx.addSlide();
        slide.addText(data.root, {
          x: 0.5, y: 0.5, fontSize: 32, bold: true
        });

        // Slide for each branch
        data.branches.forEach((branch) => {
          slide = pptx.addSlide();
          // Branch title
          slide.addText(branch.title, {
            x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '0055A5'
          });
          let contentStartY = 1.2;
          // Image if available
          if (this.selectedImageUrl) {
            slide.addImage({ path: this.selectedImageUrl, x: 0.5, y: 1, w: 4, h: 3 });
            contentStartY = 4.2;
          }
          // Leaf list from subBranches
          if (Array.isArray(branch.subBranches) && branch.subBranches.length) {
            branch.subBranches.forEach((leaf, i) => {
              const text = typeof leaf.title === 'string' ? leaf.title : JSON.stringify(leaf);
              slide.addText(text, {
                x: 0.7,
                y: contentStartY + i * 0.5,
                fontSize: 18,
                bullet: true,
                margin: 0.05
              });
            });
          }
        });

        console.log('Total slides:', pptx.slides.length);
        await pptx.writeFile({ fileName: 'MindMap_Presentation.pptx' });
        alert('Đã xuất PPT thành công!');
      } catch (error) {
        console.error('Export PPT error:', error);
        alert('Lỗi khi xuất PPT: ' + error.message);
      }
    },
    textWidth(text) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '12px sans-serif';
    return ctx.measureText(text).width;
    },
    drawMindMap(){
      if(!this.mindmapObject) return;
      const svg = d3.select(this.$refs.mindmapSvg);
      svg.selectAll('*').remove();
      svg.attr('width','100vw').attr('height','100vh');

      switch(this.selectedMapType){
        case 'bubble': this.drawBubbleMap(svg); break;
        case 'tree': this.drawTreeMap(svg); break;
        case 'flow': this.drawFlowMap(svg); break;
        case 'multiFlow': this.drawMultiFlowMap(svg); break;
        case 'brace': this.drawBraceMap(svg); break;
      }
    },
    drawTreeMap(svg) {
  const vm      = this;
  const w       = svg.node().clientWidth;
  const h       = svg.node().clientHeight;
  const radius  = Math.min(w, h) / 2 - 80;
  const padH    = 12;
  const linkDur = 800;
  const zoomMin = 0.5, zoomMax = 3;

  // 1) Tạo container đặt giữa và xoay -90° để root hướng lên trên
  const g = svg.append('g')
    .attr('transform', `translate(${w/2},${h/2}) rotate(0)`);

  // 2) Bật zoom & pan
  svg.call(
    d3.zoom().scaleExtent([zoomMin, zoomMax])
      .on('zoom', ({transform}) => g.attr('transform', transform))
  );

  // 3) Build hierarchy + radial layout chỉ để lấy góc
  const root = d3.hierarchy(vm.buildHierarchy(vm.mindmapObject));
  d3.cluster().size([2 * Math.PI, radius])(root);

  // 4) Tính yOffset: mỗi đoạn nhánh dài = width(text) + padH
  root.each(d => {
    if (d.depth === 0) {
      d.yOffset = 0;
    } else {
      const wTxt = vm.textWidth(d.data.name);
      d.yOffset = d.parent.yOffset + wTxt + padH;
    }
  });

  // 5) Vẽ & animate đường link, gán id để textPath
  const linkGen = d3.linkRadial().angle(d => d.x).radius(d => d.yOffset);
  g.append('g').selectAll('path')
    .data(root.links()).enter().append('path')
      .attr('class', 'link')
      .attr('id', (d,i) => `link${i}`)
      .attr('d', d => {
        // 1) Lấy path gốc
        const base = linkGen(d);
        // 2) Tính góc & bán kính cuối
        const θ = d.target.x - Math.PI/2;
        const r = d.target.yOffset;
        // 3) Độ dài muốn mở rộng
        const ext = vm.textWidth(d.target.data.name) + padH;
        // 4) Tọa độ extended point
        const x3 = (r + ext) * Math.cos(θ),
              y3 = (r + ext) * Math.sin(θ);
        // 5) Nối thẳng ra thêm
        return `${base}L${x3},${y3}`;
      })
      .attr('fill', 'none')
      .attr('stroke', 'aqua')
      .attr('stroke-width', d => d.source.depth === 0 ? 8 : 2)
      .attr('stroke-dasharray', function() {
        const L = this.getTotalLength();
        return `${L} ${L}`;
      })
      .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
      .transition()
        .duration(linkDur)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', () => { this.creatingTopic = ''; });

  // 6) Vẽ text theo đường link, phân biệt nhánh chính (depth=1) & phụ
  g.append('g').selectAll('text')
    .data(root.links()).enter().append('text')
      .append('textPath')
        .attr('xlink:href', (d,i) => `#link${i}`)
        .attr('startOffset', d => d.target.depth === 1 ? '35%' : '50%')
        .style('font-size', d => d.target.depth === 1 ? '14px' : '10px')
        .style('fill', '#333')
        .text(d => d.target.data.name);

  // 7) Vẽ root node (ellipse + text) với tối đa 4 ký tự mỗi dòng
  const label = root.data.root || root.data.name;
  const wTxt  = vm.textWidth(label);
  const rootG = g.append('g')
    .attr('transform', 'translate(0,20)'); // xuống 20px
  rootG.append('ellipse')
    .attr('rx', wTxt / 2 + padH)
    .attr('ry', padH + 7)
    .attr('fill', '#fff')
    .attr('stroke', '#333')
    .attr('stroke-width', 2);
  rootG.append('text')
    .text(label)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-size', '14px')
    .style('font-weight', 'bold');
},
wrapText(textSel, maxWidth, lineHeight = 1.2) {
    textSel.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/);
      text.text(null);

      let line = [];
      const x  = text.attr('x');
      const y  = text.attr('y');
      const dy = parseFloat(text.attr('dy')) || 0;

      // tspan đầu
      let tspan = text.append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', `${dy}em`);

      for (let i = 0; i < words.length; i++) {
        line.push(words[i]);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
          // bỏ từ cuối ra dòng kế
          line.pop();
          tspan.text(line.join(' '));
          line = [words[i]];
          tspan = text.append('tspan')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', `${lineHeight}em`)
            .text(words[i]);
        }
      }
    });
  },
  chunkText(text, wordsPerLine = 3) {
      const words = text.split(/\s+/);
      const lines = [];
      for (let i = 0; i < words.length; i += wordsPerLine) {
        lines.push(words.slice(i, i + wordsPerLine).join(' '));
      }
      return lines;
    },
    drawBubbleMap(svg) {
      const vm = this;
      const w  = svg.node().clientWidth;
      const h  = svg.node().clientHeight;
      const cx = w / 2;
      const cy = h / 2;

      // 1) Xóa cũ và tạo group
      svg.selectAll('*').remove();
      const g = svg.append('g');
      svg.call(
        d3.zoom().scaleExtent([0.5, 3])
          .on('zoom', ({ transform }) => g.attr('transform', transform))
      );

      // 2) Lấy dữ liệu và số nhánh chính
      const data     = vm.buildHierarchy(vm.mindmapObject);
      const branches = data.children || [];
      const Nroot    = Math.max(1, branches.length);

      // 3) Tham số chung
      const padH         = 8;
      const font0        = '16px sans-serif';
      const font1        = '12px sans-serif';
      const linkLen1     = 120;
      const linkLen2Base = 60;
      const extraLeaf    = 60; // +60px cho nhánh cuối

      // Hàm đệ quy vẽ node với animate
      function drawNode(node, x, y, depth, baseAngle) {
        // a) Wrap text mỗi 3 từ
        const words = node.name.split(/\s+/);
        const lines = [];
        for (let i = 0; i < words.length; i += 3) {
          lines.push(words.slice(i, i + 3).join(' '));
        }

        // b) Tính bán kính động
        const font     = depth === 0 ? font0 : font1;
        const maxW     = Math.max(...lines.map(l => vm.textWidth(l, font)));
        const defaultR = depth === 0 ? 80 : 40;
        const rDyn     = Math.max(defaultR, maxW / 2 + padH);

        // c) Vẽ circle (ẩn)
        const circ = g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', rDyn)
          .attr('fill', depth === 0 ? 'aqua' : 'white')
          .attr('stroke', depth === 0 ? '#333' : '#007bff')
          .attr('stroke-width', depth === 0 ? 2 : 1.5)
          .attr('opacity', 0);

        // d) Vẽ text (ẩn)
        const txt = g.append('text')
          .attr('x', x)
          .attr('y', y - (lines.length - 1) * 6)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', depth === 0 ? '18px' : (depth===1 ? '14px':'10px'))
          .style('fill', '#333')
          .attr('opacity', 0);
        lines.forEach((ln, i) => {
          txt.append('tspan')
            .attr('x', x)
            .attr('dy', i === 0 ? '0em' : '1.2em')
            .text(ln);
        });

        // e) Nếu lá thì show ngay
        const kids = node.children || [];
        if (!kids.length) {
          circ.transition().delay(400).duration(300).attr('opacity', 1);
          txt.transition().delay(400).duration(300).attr('opacity', 1);
          return;
        }

        // f) Tính sector cho nhánh
        if (depth === 0) {
          // Nhánh chính: căn giữa sector
          const radSector = 2 * Math.PI / Nroot;
          for (let i = 0; i < Nroot; i++) {
            const θ  = -Math.PI/2 + radSector/2 + i * radSector;
            const len = linkLen1;
            const x1  = x + Math.cos(θ) * rDyn;
            const y1  = y + Math.sin(θ) * rDyn;
            const x2  = x + Math.cos(θ) * (rDyn + len);
            const y2  = y + Math.sin(θ) * (rDyn + len);

            // line animate
            g.append('line')
              .attr('x1', x1).attr('y1', y1)
              .attr('x2', x1).attr('y2', y1)
              .attr('stroke', '#aaa').attr('stroke-width', 2)
              .transition().duration(500)
                .attr('x2', x2).attr('y2', y2)
              .on('end', () => {
                circ.transition().duration(300).attr('opacity', 1);
                txt.transition().duration(300).attr('opacity', 1);
                drawNode(kids[i], x2, y2, 1, θ);
              });
          }
        } else {
          // Cấp >=1: vẫn chia sector khớp branch gốc
          const radSector = 2 * Math.PI / Nroot;
          const startAng  = baseAngle - radSector/2;
          const countSub  = kids.length;
          for (let i = 0; i < countSub; i++) {
            const θ   = startAng + radSector * (i/(countSub-1||1));
            let len = linkLen2Base + (countSub - 1) * 20;
            // nếu leaf cấp 2 thì kéo dài thêm
            if (!kids[i].children?.length) len += extraLeaf;

            const x1 = x + Math.cos(θ) * rDyn;
            const y1 = y + Math.sin(θ) * rDyn;
            const x2 = x + Math.cos(θ) * (rDyn + len);
            const y2 = y + Math.sin(θ) * (rDyn + len);

            g.append('line')
              .attr('x1', x1).attr('y1', y1)
              .attr('x2', x1).attr('y2', y1)
              .attr('stroke', '#aaa').attr('stroke-width', 2)
              .transition().duration(500)
                .attr('x2', x2).attr('y2', y2)
              .on('end', () => {
                circ.transition().duration(300).attr('opacity', 1);
                txt.transition().duration(300).attr('opacity', 1);
                drawNode(kids[i], x2, y2, depth + 1, θ);
              });
          }
        }
      }

      // 5) Bắt đầu vẽ từ root
      drawNode(data, cx, cy, 0, 0);
  
    },
    drawFlowMap(svg) {
  const vm = this;

  // 1) reset + marker arrow
  svg.selectAll('*').remove();
  const defs = svg.append('defs');

  // --- Định nghĩa marker arrow ---
  defs.append('marker')
    .attr('id','arrow')
    .attr('viewBox','0 -5 10 10')
    .attr('refX',10).attr('refY',0)
    .attr('markerWidth',6).attr('markerHeight',6)
    .attr('orient','auto')
    .append('path')
      .attr('d','M0,-5L10,0L0,5')
      .attr('fill','#888');

  // --- Định nghĩa gradient cho node ---
  // Linear gradient từ trắng sang xanh nhẹ (có thể thay màu tuỳ ý)
  const grad = defs.append('linearGradient')
    .attr('id', 'nodeGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%');

  grad.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#ffffff'); // Trắng ở góc trên-trái
  grad.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#e0f7fa'); // Xanh nhạt ở góc dưới-phải

  // 2) container + zoom/pan
  const offsetX = 200, offsetY = 20;
  const g = svg.append('g')
    .attr('transform', `translate(${offsetX},${offsetY})`);
  svg.call(
    d3.zoom()
      .scaleExtent([0.1,4])
      .on('zoom', ({transform}) => g.attr('transform', transform))
  );

  // 3) hierarchy + tree layout
  const data = vm.buildHierarchy(vm.mindmapObject);
  const root = d3.hierarchy(data);
  const treeLayout = d3.tree()
    .nodeSize([80, 200])
    .separation((a, b) => a.parent === b.parent ? 1 : 2);
  treeLayout(root);

  // 4) link generator
  const linkGen = d3.linkHorizontal()
    .x(d => d.y)
    .y(d => d.x);

  // 5) draw & animate links
  g.selectAll('path.link')
    .data(root.links())
    .enter().append('path')
      .attr('class', 'link')
      .attr('d', linkGen)
      .attr('fill','none')
      .attr('stroke','aqua')        // Chuyển thành màu aqua
      .attr('stroke-width',2)
      .attr('marker-end','url(#arrow)')
      // Chuẩn bị animation
      .attr('stroke-dasharray', function() {
        const L = this.getTotalLength();
        return `${L} ${L}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
    .transition()
      // Delay theo depth để vẽ từ gốc trước, ra xa sau
      .delay(d => d.source.depth * 300)
      .duration(600)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

  // 6) wrap 4 từ 1 dòng
  function wrap4(text) {
    const words = text.split(/\s+/), lines = [];
    for (let i = 0; i < words.length; i += 3) {
      lines.push(words.slice(i, i+3).join(' '));
    }
    return lines;
  }

  // 7) draw nodes
  const nodes = g.selectAll('g.node')
    .data(root.descendants())
    .enter().append('g')
      .attr('class','node')
      .attr('transform', d => {
        const extraX = d.depth === 1 ? 100 : 0;
        return `translate(${d.y + extraX},${d.x})`;
      });

  // 8) tất cả node (kể cả root và non-root) sẽ dùng gradient làm fill
  nodes.each((d, i, els) => {
    const nd = d3.select(els[i]);
    const lines = wrap4(d.data.name);
    // Font size giảm dần theo depth; root (depth=0) sẽ to nhất
    const baseSize = 20; // bạn có thể tăng hoặc giảm baseSize tuỳ thích
    const fontSize = Math.max(8, baseSize - d.depth * 2); 
    const font = `${fontSize}px sans-serif`;

    if (d.depth === 0) {
      // --- Root node: vẽ circle ---
      // Tính toán kích thước circle dựa vào độ rộng text
      const maxW = Math.min(200,
        Math.max(...lines.map(l => vm.textWidth(l, font)))
      );
      const r = maxW/2 + 20;

      nd.append('circle')
        .attr('r', r)
        .attr('fill', 'url(#nodeGradient)')    // fill bằng gradient
        .attr('stroke','#333')
        .attr('stroke-width',4);

      // Thêm text ở giữa
      const textEl = nd.append('text')
        .attr('text-anchor','middle')
        .attr('dominant-baseline','middle')
        .style('font-size', font)
        .style('font-weight','bold');

      lines.forEach((ln, idx) => {
        textEl.append('tspan')
          .attr('x', 0)
          .attr('dy', idx === 0 ? `-${(lines.length-1)*0.6}em` : '1.2em')
          .text(ln);
      });
    } else {
      // --- Non-root nodes: vẽ rect ---
      const padH = 6, padV = 4;
      const maxW = Math.max(...lines.map(l => vm.textWidth(l, font)));
      const wRect = maxW + padH * 6;
      const hRect = lines.length * 20 + padV * 2;

      nd.append('rect')
        .attr('x', d.children ? -wRect - 4 : 4)
        .attr('y', -hRect/2)
        .attr('width', wRect)
        .attr('height', hRect)
        .attr('rx', 4).attr('ry', 4)
        .attr('fill', 'url(#nodeGradient)')   // fill bằng gradient
        .attr('stroke','#007bff')
        .attr('stroke-width',1.5);

      // Thêm text bên trong rect
      const textEl = nd.append('text')
        .attr('text-anchor', d.children ? 'end' : 'start')
        .attr('dominant-baseline','middle')
        .style('font-size', font);

      // Nếu có bật includeImage và có ảnh
      if (this.includeImage && this.leafImages[d.data.name]) {
        const xOff = d.children
          ? -wRect - 10  // nếu có children: ảnh nằm bên trái
          : wRect + 10;  // ngược lại: ảnh bên phải
        nd.append('image')
          .attr('href', this.leafImages[d.data.name])
          .attr('x', xOff)
          .attr('y', -hRect / 2)
          .attr('width', 50)
          .attr('height', 50);
      }

      lines.forEach((ln, idx) => {
        textEl.append('tspan')
          .attr('x', d.children ? -padH - 4 : padH + 4)
          .attr('dy', idx === 0 ? `-${(lines.length-1)*0.6}em` : '1.2em')
          .text(ln);
      });
    }
  });

  // 9) (Nếu bạn chỉ muốn thêm ảnh cho leaf nodes, đã được xử lý ở trên)
  // Không cần đoạn code thêm image phía ngoài nữa vì đã gộp chung vào trên.
},
drawMultiFlowMap(svg) {
  const vm = this;
  const w = svg.node().clientWidth;
  const h = svg.node().clientHeight;

  // 1) Clear & marker
  svg.selectAll('*').remove();
  const defs = svg.append('defs');

  // --- Định nghĩa marker arrow ---
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 5)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#888');

  // --- Định nghĩa gradient cho node ---
  const grad = defs.append('linearGradient')
    .attr('id', 'nodeGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%');
  grad.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#ffffff'); // Trắng ở góc trên-trái
  grad.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#e0f7fa'); // Xanh nhạt ở góc dưới-phải

  // 2) Container + zoom/pan
  const g = svg.append('g')
    .attr('transform', `translate(${w/2},${h/2})`);
  svg.call(
    d3.zoom().scaleExtent([0.1, 4])
      .on('zoom', ({transform}) => g.attr('transform', transform))
  );

  // 3) Text wrap utility
  function wrap4(txt) {
    if (typeof txt !== 'string') txt = '';
    const words = txt.split(/\s+/), lines = [];
    for (let i = 0; i < words.length; i += 3) {
      lines.push(words.slice(i, i + 3).join(' '));
    }
    return lines;
  }

  // 4) Build hierarchy & split
  const treeObj   = vm.buildHierarchy(vm.mindmapObject);
  const allKids   = treeObj.children || [];
  const half      = Math.ceil(allKids.length / 2);
  const leftKids  = allKids.slice(0, half);
  const rightKids = allKids.slice(half);
  const leftRoot  = d3.hierarchy({ children: leftKids }, d => d.children);
  const rightRoot = d3.hierarchy({ children: rightKids }, d => d.children);

  // 5) Layout
  const vert = 100, hor = 300;
  const layout = d3.tree().nodeSize([vert, hor]).separation((a,b) => a.parent === b.parent ? 1 : 2);
  layout(leftRoot);
  layout(rightRoot);

  // 6) Vertical center
  const leftYs   = leftRoot.descendants().map(d => d.x);
  const rightYs  = rightRoot.descendants().map(d => d.x);
  const leftMid  = (d3.min(leftYs) + d3.max(leftYs)) / 2;
  const rightMid = (d3.min(rightYs) + d3.max(rightYs)) / 2;

  // 7) Root metrics & shift
  const rootLines  = wrap4(treeObj.name);
  const baseSize   = 20;         // Kích thước font gốc cho root (depth = 0)
  const font0      = `${baseSize}px sans-serif`;
  const maxRW      = Math.min(200, Math.max(...rootLines.map(l => vm.textWidth(l, font0))));
  const r0         = maxRW / 2 + 20;
  const rootShiftX = 30;

  // 8) Marker & margin params
  const padH         = 6;
  const padV         = 4;
  const markerAdjust = 4;
  const marginLeft   = -80;
  const marginRight  = 100;

  // computeShift: để căn chỉnh vị trí mũi tên chạm đúng biên node
  function computeShift(name, depth) {
    // depth ở đây là depth tính theo cây nhỏ (subtree).
    // Font size cũng tính dựa vào depth
    const fontSize = Math.max(8, baseSize - depth * 2);
    const font = `${fontSize}px sans-serif`;
    const lines = wrap4(name);
    const maxW = Math.max(...lines.map(l => vm.textWidth(l, font)));
    const rectW = maxW + padH * 6;
    return rectW / 2 + markerAdjust;
  }

  // 9) Draw links under nodes
  const doLinks = (root, flip) => {
    const linkGen = d3.linkHorizontal()
      .x(d => flip ? -d.y : d.y)
      .y(d => d.x);

    g.append('g').selectAll('path.link').data(root.links()).enter().append('path')
      .attr('class','link')
      .attr('fill','none')
      .attr('stroke','aqua')          // Chuyển sang màu aqua
      .attr('stroke-width',2)
      .attr('marker-end','url(#arrow)')
      .attr('stroke-dasharray', function() {
        const L = this.getTotalLength();
        return `${L} ${L}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
      .attr('d', d => {
        // Tính toán vị trí nguồn và đích, căn giữa theo mid
        const vSrc = d.source.x - (flip ? rightMid : leftMid);
        const vTgt = d.target.x - (flip ? rightMid : leftMid);

        // Đối với source (nút cha), nếu depth = 0 (root của subtree),
        // cần cộng thêm bán kính r0 để link chạm đúng biên
        const hSrc = d.source.y + (d.source.depth === 0 ? (flip ? -r0 : r0) : 0);

        // Đối với target, căn chỉnh để mũi tên chạm đúng biên rect
        let hTgt = d.target.y;
        const shift = computeShift(d.target.data.name, d.target.depth);
        if (!flip && d.target.depth === 1)       hTgt += shift;
        if (flip && !d.target.children)          hTgt -= shift;

        return linkGen({
          source: { x: vSrc, y: hSrc },
          target: { x: vTgt, y: hTgt }
        });
      })
      .transition()
        .delay(d => d.source.depth * 300)
        .duration(600)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
  };
  doLinks(leftRoot, true);
  doLinks(rightRoot, false);

  // 10) Draw root above links
  const rootG = g.append('g').attr('transform', `translate(${rootShiftX},0)`);
  rootG.append('circle')
    .attr('r', r0)
    .attr('fill', 'url(#nodeGradient)') // Fill bằng gradient
    .attr('stroke', '#333')
    .attr('stroke-width', 4);

  const rt = rootG.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', font0)
    .style('font-weight', 'bold');
  rootLines.forEach((ln, i) => {
    rt.append('tspan')
      .attr('x', 0)
      .attr('dy', i === 0 ? `-${(rootLines.length - 1) * 0.6}em` : '1.2em')
      .text(ln);
  });

  // 11) Draw nodes above links
  const doNodes = (root, flip) => {
    g.append('g').selectAll('g.node').data(root.descendants().slice(1)).enter().append('g')
      .attr('class','node')
      .attr('transform', d => {
        const v = d.x - (flip ? rightMid : leftMid);
        let h = d.y;
        if (!flip && d.depth === 1)  h += marginRight;
        if (flip && !d.children)      h -= marginLeft;
        const x = flip ? -h : h;
        return `translate(${x},${v})`;
      })
      .each(function(d) {
        const nd = d3.select(this);
        const lines = wrap4(d.data.name);

        // --- Tính font size giảm dần theo depth ---
        const fontSize = Math.max(8, baseSize - d.depth * 2);
        const textFont = `${fontSize}px sans-serif`;

        // Tính kích thước rect dựa vào textFont
        const maxW = Math.max(...lines.map(l => vm.textWidth(l, textFont)));
        const wRect = maxW + padH * 6;
        const hRect = lines.length * 20 + padV * 2;

        // Vẽ rect với gradient
        nd.append('rect')
          .attr('x', d.children ? -wRect - 4 : 4)
          .attr('y', -hRect / 2)
          .attr('width', wRect)
          .attr('height', hRect)
          .attr('rx', 4).attr('ry', 4)
          .attr('fill', 'url(#nodeGradient)')  // background gradient
          .attr('stroke', '#007bff')
          .attr('stroke-width', 1.5);

        // Thêm text bên trong rect, với font size đã tính
        const t = nd.append('text')
          .attr('text-anchor', d.children ? 'end' : 'start')
          .attr('dominant-baseline', 'middle')
          .style('font-size', textFont);

        lines.forEach((ln, i) => {
          t.append('tspan')
            .attr('x', d.children ? -padH - 4 : padH + 4)
            .attr('dy', i === 0 ? `-${(lines.length - 1) * 0.6}em` : '1.2em')
            .text(ln);
        });
      });
  };
  doNodes(leftRoot, true);
  doNodes(rightRoot, false);
},

drawBraceMap(svg) {
  const w = svg.node().clientWidth;
  const h = svg.node().clientHeight;

  // — Clear old elements —
  svg.selectAll('*').remove();

  // — Build hierarchy & initial layout —
  const root = d3.hierarchy(this.buildHierarchy(this.mindmapObject));
  d3.tree().size([w - 100, h - 100])(root);
  const level1Count = root.children ? root.children.length : 0;
  root.x = 200 * level1Count;

  // — Create group at center apex + zoom support —
  const g = svg.append('g')
    .attr('transform', `translate(${w/2},20)`);
  svg.call(
    d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', ({ transform }) => {
        g.attr('transform', `translate(${transform.x + w/2},${transform.y + 20}) scale(${transform.k})`);
      })
  );

  // — Fan-out leaf nodes under each level-1 node —
  const leafYSpacing = 100;
  const leafXSpacing = 120;
  const level1MarginX = 500;
  (root.children || []).forEach((parent, i) => { parent.x = i * level1MarginX; });
  root.children.forEach(parent => {
    const leaves = parent.children || [];
    const n = leaves.length;
    leaves.forEach((leaf, i) => {
      leaf.x = parent.x + (i - (n - 1) / 2) * leafXSpacing;
      leaf.y = parent.y + leafYSpacing;
    });
  });

  // — Draw & animate links —
  const links = g.append('g').selectAll('path.link')
    .data(root.links())
    .enter().append('path')
      .attr('class', 'link')
      .attr('d', d => d.target.depth === 2
        ? `M${d.source.x},${d.source.y}L${d.source.x},${d.target.y}L${d.target.x},${d.target.y}`
        : `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`
      )
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('marker-end', 'url(#arrow)')
      .each(function() {
        const total = this.getTotalLength();
        d3.select(this)
          .attr('stroke-dasharray', `${total} ${total}`)
          .attr('stroke-dashoffset', total);
      });
  links.transition()
    .delay(d => d.source.depth * 300)
    .duration(600)
    .attr('stroke-dashoffset', 0)
    .ease(d3.easeLinear);

  // — Draw & animate nodes —
  const wrapLines = txt => {
    const words = (txt || '').split(/\s+/);
    const lines = [];
    for (let i = 0; i < words.length; i += 3) {
      lines.push(words.slice(i, i + 3).join(' '));
    }
    return lines;
  };

  const nodes = g.append('g').selectAll('g.node')
    .data(root.descendants())
    .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('opacity', 0);

  nodes.each(function(d) {
    const nd = d3.select(this);
    const lines = wrapLines(d.data.name);
    // Set style by depth
    let fontSize, pad, strokeWidth;
    if (d.depth === 0) {
      fontSize = 18; pad = 15; strokeWidth = 3;
    } else if (d.depth === 1) {
      fontSize = 14; pad = 10; strokeWidth = 2;
    } else {
      fontSize = 10; pad = 6; strokeWidth = 1;
    }
    const text = nd.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', `${fontSize}px`);
    lines.forEach((ln, i) => {
      text.append('tspan')
        .attr('x', 0)
        .attr('dy', i === 0 ? `-${(lines.length - 1) * 0.6}em` : '1.2em')
        .text(ln);
    });
    const bbox = text.node().getBBox();
    nd.insert('rect', 'text')
      .attr('x', bbox.x - pad)
      .attr('y', bbox.y - pad)
      .attr('width', bbox.width + pad * 2)
      .attr('height', bbox.height + pad * 2)
      .attr('rx', pad/2)
      .attr('ry', pad/2)
      .attr('fill', 'white')
      .attr('stroke', 'purple')
      .attr('stroke-width', strokeWidth);
  });

  nodes.transition()
    .delay(d => d.depth * 300 + 600)
    .duration(600)
    .attr('opacity', 1);

},
    buildHierarchy(obj) {
      const root = { name: obj.root, children: [] };
      (obj.branches||[]).forEach(b => {
        const node = { name: b.title, children: [] };
        (b.subBranches||[]).forEach(s => node.children.push({ name: s }));
        root.children.push(node);
      });
      return root;
    }
  }
};
</script>

<style scoped>
.panel {
  display: flex;
  height: 100vh;
  padding: 16px;
  gap: 16px;
  font-family: Arial, sans-serif;
  width: 100%;
}

.left-panel {
  width: 20%;
  background: radial-gradient(rgb(173, 252, 252),white);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: all 0.3s ease;
}
.left-panel h3{
  text-align: center;
}
.left-panel.hidden {
  width: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.suggestion-item {
  position: relative;
  margin-bottom: 12px;
  list-style: none;
  margin-left: 0;
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.right-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: width 0.3s ease;
}

.right-panel.full {
  width: 100%;
}

.mindmap-display {
  flex-grow: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: auto;
}

.mindmap-image {
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 16px;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input[type="text"] {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.option-select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.file-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #007bff;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.file-upload input {
  display: none;
}

.create-btn {
  border: none;
  background: #28a745;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.toolbarAI {
  background: linear-gradient(135deg, rgb(77, 70, 70), aqua);
  display: flex;
  padding: 10px;
  width: 100%;
  border-radius: 10px;
}

.toolbarAI_left {
  width: 40%;
}

.toolbarAI_right {
  width: 60%;
  display: flex;
  justify-content: flex-end;
}

.toolbarAI_right button {
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  background-color: white;
  color: #333;
  font-weight: bold;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
  cursor: pointer;
  margin-right: 10px;
}

.toolbarAI_right button:hover {
  background-color: yellow;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.toolbarAI_left button {
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  background-color: white;
  color: #333;
  font-weight: bold;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
  cursor: pointer;
  margin-right: 10px;
}
.toolbarAI_left button:hover {
  background-color: yellow;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.toolbarAI_left a{
  text-decoration: none;
  color:black;
}
.AI{
  background: radial-gradient(rgb(173, 252, 252),white);
}
.mindmap-svg {
  width: 100%;
  height: 100%;
  background: #fff;
}
.modal-backdrop { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal { background:#fff; padding:20px; border-radius:8px; width:300px; }
.modal h3 { margin:0 0 10px; }
.modal input { width:100%; padding:8px; margin:10px 0; box-sizing:border-box; }
.modal-actions { text-align:right; }
.modal-actions button { margin-left:8px; padding:6px 12px; }
.map-type-select{
  margin-right: 50px;
  width: 100px;
  display: block;
}
.map-type-select select{
  padding: 10px 15px;
  border-radius: 8px;
}
.mindmap-svg text {
  font-family: "Roboto", "Arial", sans-serif;
  font-size: 14px;
}
.left-panel {
  width: 260px;
  padding: 16px;
  background: #fafafa;
  border-right: 1px solid #ddd;
}
.left-panel.hidden { display: none; }

.suggestion-list {
  list-style: none;
  margin: 0; padding: 0;
}
.suggestion-item + .suggestion-item { margin-top: 12px; }

.suggestion-item button {
  margin-left: 0;
  align-items: center;
  width: 100%;
  height:100%;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.suggestion-item button img{
  width:100%;
  height:100%;
}
.suggestion-item button:hover { background: #f0f0f0; }
.suggetion-list {
  margin: 0;
  padding-left: 0;
}
.thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  margin-right: 8px;
  border-radius: 4px;
}
.title {
  flex: 1;
  text-align: left;
  font-size: 14px;
}
</style>