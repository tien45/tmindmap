<template>
  <div class="mindmap-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="zoomIn()">
          <i class="fa-solid fa-search-plus"></i>
        </button>
        <button class="toolbar-btn" @click="zoomOut()">
          <i class="fa-solid fa-search-minus"></i>
        </button>
        <button class="toolbar-btn" @click="undo()">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button class="toolbar-btn" @click="redo()">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
        <button class="toolbar-btn" @click="removeNode()">
          <i class="fa-solid fa-trash"></i>
        </button>
        <button class="toolbar-btn" @click="uploadImage()">
          <i class="fa-solid fa-upload"></i>
        </button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="exportImage">
          <i class="fa-solid fa-image"></i>
          <span>Xuất hình ảnh</span>
        </button>
        <button class="toolbar-btn" @click="exportPPT">
          <i class="fa-solid fa-file-powerpoint"></i>
          <span>Xuất PPT</span>
        </button>
        <button @click="openModal" class="toolbar-btn">
          <i class="fa-solid fa-floppy-disk"></i>
          <span>{{ isEditing ? 'Cập nhật' : 'Lưu sơ đồ' }}</span>
        </button>
        <button class="toolbar-btn ai-button">
          <a href="/createMMAI">
            <i class="fa-solid fa-robot"></i>
            <span>TẠO VỚI AI</span>
          </a>
        </button>
      </div>
    </div>
    <div class="modal-backdrop" v-if="showModal">
      <div class="modal">
        <h3>Đặt tên sơ đồ tư duy</h3>
        <input v-model="form.mapTitle" placeholder="Tên sơ đồ tư duy" />
        <div class="modal-actions">
          <button @click="_postSaveManual">Lưu</button>
          <button @click="closeModal">Huỷ</button>
        </div>
      </div>
    </div>
    <!-- Input ẩn để tải ảnh lên -->
    <input type="file" id="imageUploader" accept="image/*" style="display: none;" @change="handleFileSelect" />

    <div class="content">
      <!-- Left Panel: Các công cụ & cài đặt -->
      <div class="left-panel">
        <!-- Chọn hình dạng node -->
        <div class="node-shapes">
          <h3><i class="fa-solid fa-shapes"></i> Hình dạng</h3>
          <div class="shape">
            <div class="shape-option" draggable="true" @dragstart="dragStart('rectangle')">
              <i class="fa-solid fa-square"></i>
            </div>
            <div class="shape-option" draggable="true" @dragstart="dragStart('circle')">
              <i class="fa-solid fa-circle"></i>
            </div>
            <div class="shape-option" draggable="true" @dragstart="dragStart('label')">
              <i class="fa-solid fa-tag"></i>
            </div>
          </div>
        </div>

        <!-- Định dạng chữ -->
        <div class="text-formatting">
          <h3><i class="fa-solid fa-text-height"></i> Kiểu chữ</h3>
          <div class="fomat">
            <button class="format-btn" :class="{ active: selectedNode && selectedNode.isBold }" @click="toggleBold">
              <i class="fa-solid fa-bold"></i>
            </button>
            <button class="format-btn" :class="{ active: selectedNode && selectedNode.isItalic }" @click="toggleItalic">
              <i class="fa-solid fa-italic"></i>
            </button>
            <button class="format-btn" :class="{ active: selectedNode && selectedNode.align === 'left' }"
              @click="setAlign('left')">
              <i class="fa-solid fa-align-left"></i>
            </button>
            <button class="format-btn" :class="{ active: selectedNode && selectedNode.align === 'center' }"
              @click="setAlign('center')">
              <i class="fa-solid fa-align-center"></i>
            </button>
            <button class="format-btn" :class="{ active: selectedNode && selectedNode.align === 'right' }"
              @click="setAlign('right')">
              <i class="fa-solid fa-align-right"></i>
            </button>
            <input type="color" v-model="selectedColor" @change="applyTextColor" class="color-picker" title="Màu chữ">
          </div>
          <select v-model="selectedFont" @change="applyFontFamily" class="style-select">
            <option value="">Font</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        <!-- Cài đặt Node Style -->
        <h3><i class="fa-solid fa-paintbrush"></i> Style Node</h3>
        <div class="node-style">
          <div class="style-group-node">
            <input type="color" v-model="nodeBorderColor" @change="updateNode(selectedNode)" class="color-picker"
              title="Màu viền">
            <input type="color" v-model="nodeBackgroundColor" @change="updateNode(selectedNode)" class="color-picker"
              title="Màu nền">
            <input type="number" v-model.number="nodeBorderThickness" min="1" @input="updateNode(selectedNode)"
              class="number-input">
            <select v-model="nodeBorderStyle" @change="updateNode(selectedNode)" class="style-select">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>

        <!-- Cài đặt Link Style -->
        <div class="link-style">
          <h3><i class="fa-solid fa-sitemap"></i> Style Link</h3>
          <div class="style-group">
            <input type="color" v-model="linkColor" @change="updateLink(selectedLink)" class="color-picker"
              title="Màu liên kết" />
            <input type="number" min="1" v-model.number="linkThickness" @change="updateLink(selectedLink)"
              class="number-input" />
          </div>

          <div class="style-group">
            <select v-model="linkDash" class="style-select" @change="updateLink(selectedLink)">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>

          <div class="style-group">
            <label>Độ cong:</label>
            <input type="range" min="-1" max="1" step="0.05" v-model.number="linkCurvature"
              @change="updateLink(selectedLink)" />
            <span>{{ linkCurvature }}</span>
          </div>

          <div class="style-group">
            <select v-model="linkMarker" @change="updateLink(selectedLink)" class="style-select">
              <option value="none">Không</option>
              <option value="arrow">Mũi tên</option>
              <option value="tree">Cành cây</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <div class="canvas" ref="canvas" @click.self="clearSelection" @dragover.prevent @drop="drop($event)"
         @wheel.prevent="onWheel"
         :style="{
          transform: `scale(${scale})`,
          transformOrigin: '0 0'
        }">
      
        <svg class="link-canvas" ref="canva">
          <defs>
            <!-- Marker mũi tên (arrow) -->
            <marker id="arrow" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" refX="6" refY="3"
              orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
            </marker>
          </defs>

          <!-- 1 vòng lặp duy nhất qua tất cả links -->
          <g v-for="(link, i) in links" :key="i" @click.stop="handleLinkClick(link)">
            <!-- A) Tree mode: vẽ gốc circle to + thân mảnh -->
            <path v-if="link.marker === 'tree'" @click.stop="selectLink(link)" :d="computeTaperedBranch(link)"
              :fill="link.color" :class="{ 'link--selected': link === selectedLink }" />
            <!-- C) Node→free-pos -->
            <path @click.stop="selectLink(link)"
              v-else-if="getLinkPath(link.from, link.toPos || link.to, !!link.toPos, link.curvature)"
              :d="getLinkPath(link.from, link.toPos || link.to, !!link.toPos, link.curvature)" :stroke="link.color"
              :stroke-width="link.thickness" :stroke-dasharray="dashArray(link.dash)"
              :marker-end="link.marker === 'none' ? null : `url(#${link.marker})`" fill="none" />
            <circle v-if="link === selectedLink && link.toPos" :cx="link.toPos.x" :cy="link.toPos.y" r="6"
              style="cursor:move; pointer-events:all;" @mousedown.stop.prevent="startDragEnd(link, $event)" />
            <!-- B) Regular mode: node→node straight or curved, arrow/none -->
            <line v-else-if="!link.toPos && link.curvature === 0" :x1="getNodeCenter(link.from).x"
              :y1="getNodeCenter(link.from).y" :x2="getNodeCenter(link.to).x" :y2="getNodeCenter(link.to).y"
              :stroke="link.color" :stroke-width="link.thickness" :stroke-dasharray="dashArray(link.dash)"
              :marker-end="link.marker === 'none' ? null : `url(#${link.marker})`" fill="none"
              @click.stop="selectLink(link)" />
            <path v-else-if="!link.toPos" :d="getLinkPath(link.from, link.to, false, link.curvature)"
              :stroke="link.color" :stroke-width="link.thickness" :stroke-dasharray="dashArray(link.dash)"
              :marker-end="link.marker === 'none' ? null : `url(#${link.marker})`" fill="none"
              @click.stop="selectLink(link)" />
            <!-- D) Handle chỉnh độ cong -->
            <circle v-if="link === selectedLink" :cx="midPoint(link).x" :cy="midPoint(link).y" r="6" fill="white"
              stroke="gray" stroke-width="1" style="pointer-events: all; cursor: move;"
              @mousedown.prevent="startAdjustCurvature(link, $event)" />
          </g>
          <line v-if="linking.active && linking.fromNode" :x1="getNodeCenter(linking.fromNode.id).x"
            :y1="getNodeCenter(linking.fromNode.id).y" :x2="linking.tempPos.x" :y2="linking.tempPos.y" stroke="#999"
            stroke-dasharray="4,4" />
        </svg>
        <!-- Phần render nodes (không thay đổi) -->
        <div v-for="node in nodes" :key="node.id" :data-id="node.id" :class="{ 'node--disabled': linkMode }"
          class="node" :style="{
            top: node.top + 'px',
            left: node.left + 'px',
            width: node.width + 'px',
            height: node.height + 'px',
            overflow: 'visible',
            transform: `rotate(${node.rotation}deg)`,
            transformOrigin: 'center center'
          }" @mousedown="startDragNode(node, $event)" @click.stop="handleNodeClick(node)">
          <div v-if="selectedNode && selectedNode.id === node.id" class="rotate-handle"
            @mousedown.stop.prevent="startRotate(node, $event)">
            <i class="fa-solid fa-arrows-spin"></i>
          </div>
          <!-- dấu + chỉ hiển thị khi node được chọn -->
          <div v-if="selectedNode && selectedNode.id === node.id" class="link-handle"
            @mousedown.stop.prevent="beginLink(node, $event)">+</div>

          <div class="shape-inner" :class="node.type" :style="shapeInnerStyle(node)" :contenteditable="!linking.active"
            @blur="updateNodeText($event, node)">
            <template v-if="node.type === 'image'">
              <img :src="node.image" alt="node image" style="width:100%; height:100%; object-fit: contain;" />
            </template>
            <template v-else>
              <span v-html="node.text || node.type"></span>
            </template>
          </div>

          <!-- resize handles -->
          <template v-if="selectedNode && selectedNode.id === node.id">
            <div class="resize-handle top-left" @mousedown.stop="startResize(node, $event, 'top-left')"></div>
            <div class="resize-handle top-center" @mousedown.stop="startResize(node, $event, 'top-center')"></div>
            <div class="resize-handle top-right" @mousedown.stop="startResize(node, $event, 'top-right')"></div>
            <div class="resize-handle mid-left" @mousedown.stop="startResize(node, $event, 'mid-left')"></div>
            <div class="resize-handle mid-right" @mousedown.stop="startResize(node, $event, 'mid-right')"></div>
            <div class="resize-handle bottom-left" @mousedown.stop="startResize(node, $event, 'bottom-left')"></div>
            <div class="resize-handle bottom-center" @mousedown.stop="startResize(node, $event, 'bottom-center')"></div>
            <div class="resize-handle bottom-right" @mousedown.stop="startResize(node, $event, 'bottom-right')"></div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import * as htmlToImage from 'html-to-image';
let idCounter = 1;
export default {
  name: "CreateMindMap",
  props: {
    id: { type: String, default: null }
  },
  data() {
    return {
      scale: 1,
      minScale: 0.2,
      maxScale: 3,
      scaleStep: 0.1,
      translate: { x: 0, y: 0 },
      history: [],
      nodes: [],        // luôn là mảng, không bao giờ undefined
      links: [],
      rawData: [],
      historyIndex: -1,
      linking: {
        active: false,
        fromNode: null,
        tempPos: { x: 0, y: 0 }
      },
      linkMode: false,
      currentDrag: null,
      selectedNode: null,
      draggingNode: null,
      selectedLink: null,
      offsetX: 0,
      offsetY: 0,
      resizingNode: null,
      resizeDir: null,
      startX: 0,
      startY: 0,
      startW: 0,
      startH: 0,
      startL: 0,
      startT: 0,
      customColor: false,
      customColor1: false,
      selectedFont: '',
      selectedColor: '#000000',
      selectedAlign: 'center',
      defaultNodeBorderColor: '#333333',
      defaultNodeBackgroundColor: '#ffffff',
      defaultNodeBorderThickness: 2,
      defaultNodeBorderStyle: 'solid',
      dragStartSave: { x: 0, y: 0 },
      defaultLinkColor: '#000000',
      defaultLinkThickness: 2,
      defaultLinkDash: 'solid',
      defaultLinkCurvature: 0,        // 0 = thẳng, >0 = cong
      defaultLinkMarker: 'none',
      draggingLinkEnd: null,
      mindmapData: null,
      selectedTemplate: null,
      loading: false,
      error: null,
      selectedMapType: 'free',
      mindmapObject: null,
      showModal: false,
      form: {
        mapTitle: ''
      },
      rotatingNode: null,
      rotateStartAngle: 0,
      rotateCenter: { x: 0, y: 0 },
      svg: null,
    }
  },
  async mounted() {
  // 1) khởi tạo SVG reference
  this.svg = d3.select(this.$refs.canva);

  // 2) fetch data
  const { id } = this.$route.params;
  if (!id) return;
  this.loading = true;
  try {
    const resp = await fetch(
      `http://localhost:5000/api/listMindmap/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    const result = await resp.json();
    const item = result.item ?? result.data ?? result.payload ?? result;
    this.form.mapTitle = item.title;
    const mapType = item.mapType ?? item.type;
    let rawData = (mapType === 'manual' || mapType === 'free')
      ? item.manualData
      : item.mindmapData;
    if (typeof rawData === 'string') rawData = JSON.parse(rawData);

    // 3) map lại nodes để thêm left/top, gán vào state
    this.nodes = (rawData.nodes || []).map(n => ({
      ...n,
      left: n.x,   // CSS của Vue template dùng left/top
      top:  n.y,
    }));
    this.links = rawData.links || [];

    // 4) nếu manual, sanitize text
    if (mapType === 'manual') {
      this.nodes.forEach(n => {
        n.text = String(n.text).replace(/<[^>]+>/g, '');
      });
    }

    this.selectedMapType = mapType;
    this.mindmapObject = rawData;

    // 5) chờ Vue render rồi vẽ D3 cho links
    this.$nextTick(() => {
      this.drawMindMap(this.svg);
      this.initSelection && this.initSelection();
    });

  } catch (e) {
    console.error(e);
    this.error = e.message;
  } finally {
    this.loading = false;
  }
},


  computed: {
    nodeBorderColor: {
      get() {
        return this.selectedNode?.borderColor ?? this.defaultNodeBorderColor;
      },
      set(val) {
        if (this.selectedNode) {
          this.selectedNode.borderColor = val;
        } else {
          this.defaultNodeBorderColor = val;
        }
      }
    },
    nodeBackgroundColor: {
      get() {
        return this.selectedNode?.backgroundColor ?? this.defaultNodeBackgroundColor;
      },
      set(val) {
        if (this.selectedNode) {
          this.selectedNode.backgroundColor = val;
        } else {
          this.defaultNodeBackgroundColor = val;
        }
      }
    },
    nodeBorderThickness: {
      get() {
        return this.selectedNode?.borderThickness ?? this.defaultNodeBorderThickness;
      },
      set(val) {
        if (this.selectedNode) {
          this.selectedNode.borderThickness = val;
        } else {
          this.defaultNodeBorderThickness = val;
        }
      }
    },
    nodeBorderStyle: {
      get() {
        return this.selectedNode?.borderStyle ?? this.defaultNodeBorderStyle;
      },
      set(val) {
        if (this.selectedNode) {
          this.selectedNode.borderStyle = val;
        } else {
          this.defaultNodeBorderStyle = val;
        }
      }
    },
    straightLinks() {
      return this.links.filter(l => (l.curvature || 0) === 0 && l.to !== undefined);
    },
    // Các link cong (curvature > 0)
    curvedLinks() {
      return this.links.filter(l => (l.curvature || 0) > 0 && l.to !== undefined);
    },
    // chỉ những link có .toPos (node → vị trí free)
    posLinks() {
      return this.links.filter(l => l.toPos !== undefined);
    },
    linkColor: {
      get() {
        return this.selectedLink?.color ?? this.defaultLinkColor;
      },
      set(val) {
        if (this.selectedLink) {
          this.selectedLink.color = val;
        } else {
          this.defaultLinkColor = val;
        }
      }
    },

    // Độ dày
    linkThickness: {
      get() {
        return this.selectedLink?.thickness ?? this.defaultLinkThickness;
      },
      set(val) {
        if (this.selectedLink) {
          this.selectedLink.thickness = val;
        } else {
          this.defaultLinkThickness = val;
        }
      }
    },

    // Kiểu nét (dash)
    linkDash: {
      get() {
        return this.selectedLink?.dash ?? this.defaultLinkDash;
      },
      set(val) {
        if (this.selectedLink) {
          this.selectedLink.dash = val;
        } else {
          this.defaultLinkDash = val;
        }
      }
    },

    // Độ cong
    linkCurvature: {
      get() {
        return this.selectedLink?.curvature ?? this.defaultLinkCurvature;
      },
      set(val) {
        if (this.selectedLink) {
          this.selectedLink.curvature = val;
        } else {
          this.defaultLinkCurvature = val;
        }
      }
    },

    // Marker
    linkMarker: {
      get() {
        return this.selectedLink?.marker ?? this.defaultLinkMarker;
      },
      set(val) {
        if (this.selectedLink) {
          this.selectedLink.marker = val;
        } else {
          this.defaultLinkMarker = val;
        }
      }
    },
    canSave() {
      return !!(this.selectedImageUrl || this.mindmapObject)
    },
    isEditing() {
      return !!this.$route.params.id;
    }
  },
  methods: {
    startRotate(node, event) {
      this.selectedNode = node;
      this.rotatingNode = node;

      // Lấy wrapper .node
      const wrapper = event.currentTarget.parentNode;
      const rect = wrapper.getBoundingClientRect();

      // Tọa độ tâm
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      this.rotateCenter = { x: cx, y: cy };

      // Tính góc ban đầu giữa tâm → chuột
      const mx = event.clientX;
      const my = event.clientY;
      const startAngle = Math.atan2(my - cy, mx - cx) * 180 / Math.PI;

      console.log(
        'startRotate:',
        { cx, cy, mx, my, nodeRotation: node.rotation, startAngle }
      );

      // offset = startAngle – hiện tại
      this.rotateStartAngle = startAngle - node.rotation;
      console.log('rotateStartAngle:', this.rotateStartAngle);

      // Gắn listener
      window.addEventListener('mousemove', this.onRotate);
      window.addEventListener('mouseup', this.stopRotate);
    },

    // Trong khi di chuột:
    onRotate(event) {
      if (!this.rotatingNode) return;
      const { x: cx, y: cy } = this.rotateCenter;
      const mx = event.clientX;
      const my = event.clientY;
      let angle = Math.atan2(my - cy, mx - cx) * 180 / Math.PI;
      console.log('onRotate:', { cx, cy, mx, my, rawAngle: angle });
      angle = angle - this.rotateStartAngle;
      console.log('computed rotation:', angle);
      this.rotatingNode.rotation = angle;
    },

    // Khi thả chuột:
    stopRotate() {
      window.removeEventListener('mousemove', this.onRotate);
      window.removeEventListener('mouseup', this.stopRotate);
      this.rotatingNode = null;
    },
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async exportPPT() {
      try {
        const pptx = new window.PptxGenJS();

        // 1) Build map id→node và lấy plain-text
        const map = {};
        this.nodes.forEach(n => {
          const el = document.querySelector(`.node[data-id="${n.id}"] .shape-inner`);
          const txt = el ? el.innerText.trim() : (n.text || '').trim();
          map[n.id] = { id: n.id, text: txt, children: [] };
        });

        // 2) Gán children đúng theo cấu trúc link của bạn
        this.links.forEach(l => {
          const parentId = l.from;
          const childId = l.to ?? l.attachedTo;
          if (map[parentId] && map[childId]) {
            map[parentId].children.push(map[childId]);
          }
        });

        // 3) Tập hợp tất cả ID con để tìm root
        const allChild = new Set(
          this.links.map(l => l.to ?? l.attachedTo)
        );
        const root = Object.values(map).find(n => !allChild.has(n.id));
        if (!root) return alert('Không tìm thấy root!');

        // 4) Flatten & tạo slide cho mỗi node
        const flat = [];
        const dfs = node => {
          flat.push(node);
          node.children.forEach(dfs);
        };
        dfs(root);

        flat.forEach(node => {
          const slide = pptx.addSlide();
          slide.addText(node.text, {
            x: 0.5, y: 0.5, fontSize: 28, bold: true
          });
          if (node.children.length) {
            let y0 = 1.2;
            node.children.forEach((c, i) => {
              slide.addText(c.text, {
                x: 0.7, y: y0 + i * 0.5, fontSize: 18, bullet: true, margin: 0.05
              });
            });
          }
        });

        console.log('Số slide tạo được:', pptx.slides.length);
        await pptx.writeFile({ fileName: 'MindMap_AllSlides.pptx' });
        alert('Đã xuất ' + pptx.slides.length + ' slide!');
      } catch (err) {
        console.error(err);
        alert('Lỗi khi xuất PPT: ' + err.message);
      }
    },
    _exportSvgMarkup() {
      const svgEl = this.$refs.canva;
      if (!svgEl) throw new Error('SVG not found');
      const clone = svgEl.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', svgEl.clientWidth);
      clone.setAttribute('height', svgEl.clientHeight);
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', 0);
      bg.setAttribute('y', 0);
      bg.setAttribute('width', svgEl.clientWidth);
      bg.setAttribute('height', svgEl.clientHeight);
      bg.setAttribute('fill', '#fff');
      clone.insertBefore(bg, clone.firstChild);
      return new XMLSerializer().serializeToString(clone);
    },

    // Giữ nguyên tên hàm bạn đã có
    async _generateImageFromSvg(maxWidth = 900) {
      // 1) Lấy node SVG (hoặc wrapper chứa SVG)
      //    Nếu bạn không muốn dùng exportSvgMarkup, có thể trực tiếp ref tới <svg>
      const svgEl = this.$refs.canvas;
      if (!svgEl) {
        throw new Error('SVG element not found');
      }

      // 2) Đảm bảo inline style nếu cần
      this.inlineAllStyles(svgEl);

      // 3) Tính scale để resize xuống maxWidth
      const origWidth = svgEl.clientWidth;
      const origHeight = svgEl.clientHeight;
      const ratio = maxWidth / origWidth;
      const width = maxWidth;
      const height = Math.round(origHeight * ratio);

      // 4) Gọi html-to-image.toJpeg
      try {
        const dataUrl = await htmlToImage.toJpeg(svgEl, {
          backgroundColor: 'white',  // hoặc transparent nếu muốn
          width,
          height,
          quality: 0.7                // 0.0–1.0
        });
        // dataUrl là "data:image/jpeg;base64,....", bạn có thể lưu vào CSDL
        return dataUrl;
      } catch (err) {
        console.error('Lỗi khi tạo JPEG:', err);
        throw err;
      }
    },

    // Hàm gọi fetch
    async _postSaveManual() {
  const title = this.form.mapTitle.trim();
  if (!title) return alert('Nhập tên sơ đồ tư duy');

  // 1) Phân biệt POST / PUT
  const id       = this.$route.params.id;
  console.log('id',id)
  const isUpdate = Boolean(id);
  const url      = isUpdate
    ? `http://localhost:5000/api/listMindmap/${id}`
    : 'http://localhost:5000/api/listMindmap';
  const method   = isUpdate ? 'PUT' : 'POST';

  this.loading = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Chưa có token');

    // 2) Xuất SVG + thumbnail
    const svgMarkup = this._exportSvgMarkup();
    const imageUrl  = await this._generateImageFromSvg(900);

    // 3) Chuẩn hóa manualData.nodes
    const manualNodes = this.nodes.map(node => ({
      id: node.id,
      type: node.type,
      x: node.left,
      y: node.top,
      width: node.width,
      height: node.height,
      text: node.text,
      fontFamily: node.fontFamily,
      fontSize: node.fontSize,
      isBold: node.isBold,
      isItalic: node.isItalic,
      textColor: node.textColor,
      align: node.align,
      borderColor: node.borderColor,
      borderWidth: node.borderWidth,
      borderStyle: node.borderStyle,
      backgroundColor: node.backgroundColor,
      imageUrl: node.imageUrl,
      rotation: node.rotation
    }));

    // 4) Chuẩn hóa manualData.links
    const manualLinks = this.links.map(link => {
  // Nếu link đã nối vào node khác (link.attachedTo != null), thì xóa toPos
  if (link.attachedTo != null) {
    return {
      id:    link.id || `${link.from}-${link.attachedTo}`,
      from:  link.from,
      to:    link.attachedTo || link.to,  // dùng `attachedTo` làm `to`
      toPos: null,             // reset free‐pos
      color:     link.color,
      thickness: link.thickness,
      dash:      link.dash,
      curvature: link.curvature,
      marker:    link.marker,
      custom:    link.custom
    };
  }

  // Còn nếu là free‐link (không gắn tới node), giữ nguyên toPos
    return {
      id:    link.id || `${link.from}-free`,
      from:  link.from,
      to:    null,
      toPos: link.toPos ? { x: link.toPos.x, y: link.toPos.y } : undefined,
      color:     link.color,
      thickness: link.thickness,
      dash:      link.dash,
      curvature: link.curvature,
      marker:    link.marker,
      custom:    link.custom
    };
  });

    // 5) Build payload (có thêm title, type, mapType)
    const payload = {
      title,
      type: 'manual',
      mapType: 'free',
      svgMarkup,
      imageUrl,
      manualData: {
        nodes: manualNodes,
        links: manualLinks
      }
    };

    console.log('PAYLOAD:', payload);

    // 6) Gọi API
    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.message || 'Lưu thất bại');
    }

    alert(isUpdate ? 'Cập nhật thành công!' : 'Lưu thành công!');

    // 7) Nếu là cập nhật, đè lại nodes/links từ server (tuỳ bạn có cần)
    if (isUpdate && data.manualData) {
      this.nodes = data.manualData.nodes.map(n => ({
        ...n,
        left: n.x,
        top: n.y
      }));
      this.links = data.manualData.links;
    }

    this.closeModal();
  }
  catch (e) {
    console.error(e);
    alert('Lỗi khi lưu: ' + e.message);
  }
  finally {
    this.loading = false;
  }
},

    drawMindMap() {
      const svg = d3.select(this.$refs.canva);
      svg.selectAll('path.link').remove();
      svg.selectAll('g.node').remove();

      if (this.selectedMapType === 'manual') {
        this.drawFreeMap(svg, this.mindmapObject);
      } else {
        // gọi đúng hàm AI-layout
        const fn = {
          bubble: this.drawBubbleMap,
          tree: this.drawTreeMap,
          flow: this.drawFlowMap,
          multiFlow: this.drawMultiFlowMap,
          brace: this.drawBraceMap
        }[this.selectedMapType];
        fn.call(this, svg, this.mindmapObject);
      }
    },
    findNode(id, nodes) {
      return nodes.find(n => n.id === id) || { x: 0, y: 0 };
    },
    drawTreeMap(svg, treeData) {
      const vm = this;
      const w = svg.node().clientWidth;
      const h = svg.node().clientHeight;
      const radius = Math.min(w, h) / 2 - 80;
      const padH = 12;
      const linkDur = 800;
      const zoomMin = 0.5, zoomMax = 3;

      // 1) Create group
      const g = svg.append('g')
        .attr('transform', `translate(${w / 2},${h / 2}) rotate(0)`);

      // 2) Zoom & pan
      svg.call(
        d3.zoom().scaleExtent([zoomMin, zoomMax])
          .on('zoom', ({ transform }) => g.attr('transform', transform))
      );

      // 3) Build + cluster
      const root = this.buildHierarchy(treeData);
      d3.cluster().size([2 * Math.PI, radius])(root);

      // 4) Compute offsets
      root.each(d => {
        d.yOffset = d.depth === 0 ? 0 : d.parent.yOffset + vm.textWidth(d.data.name) + padH;
      });

      // 5) Draw links
      const linkGen = d3.linkRadial().angle(d => d.x).radius(d => d.yOffset);
      g.append('g').selectAll('path')
        .data(root.links()).enter().append('path')
        .attr('class', 'link')
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .attr('id', (d, i) => `link${i}`)
        .attr('d', d => {
          const base = linkGen(d);
          const θ = d.target.x - Math.PI / 2;
          const r = d.target.yOffset;
          const ext = vm.textWidth(d.target.data.name) + padH;
          const x3 = (r + ext) * Math.cos(θ);
          const y3 = (r + ext) * Math.sin(θ);
          return `${base}L${x3},${y3}`;
        })
        .attr('fill', 'none')
        .attr('stroke', 'aqua')
        .attr('stroke-width', d => d.source.depth === 0 ? 8 : 2)
        .style('stroke-dasharray', vm.linkDash === 'dashed' ? '4,2' : vm.linkDash === 'dotted' ? '1,2' : null)
        .attr('stroke-dashoffset', function () { return this.getTotalLength(); })
        .on('click', (event, d) => {
          event.stopPropagation();
          vm.selectedLink = d;           // chọn link
        })
        .transition().duration(linkDur).ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', () => { vm.creatingTopic = ''; });

      // 6) Text on paths
      g.append('g').selectAll('text')
        .data(root.links()).enter().append('text')
        .append('textPath')
        .attr('href', (d, i) => `#link${i}`)
        .attr('xlink:href', (d, i) => `#link${i}`)
        .attr('startOffset', d => d.target.depth === 1 ? '35%' : '50%')
        .style('font-size', d => d.target.depth === 1 ? '14px' : '10px')
        .style('fill', d => d.target.data.textColor)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .text(d => d.target.data.name)
        .on('click', (event, d) => {
          event.stopPropagation();
          vm.selectedNode = d.target.data;
        });

      // 7) Root node
      const label = root.data.name;
      const wTxt = vm.textWidth(label);
      const rootG = g.append('g').attr('class', 'node-group')
        .attr('data-id', root.data.id)
        .attr('transform', 'translate(0,20)')
        .style('pointer-events', 'all')
        .style('cursor', 'pointer')
        .on('click', e => { e.stopPropagation(); vm.selectedNode = root.data; });
      const rootNode = rootG.append('g')
        .call(d3.drag().on('drag', event => {
          const t = d3.zoomTransform(svg.node());
          const x0 = t.x, y0 = t.y;
          rootG.attr('transform', `translate(${x0 + event.dx},${y0 + event.dy})`);
        }));
      rootNode.append('ellipse')
        .attr('rx', wTxt / 2 + padH)
        .attr('ry', padH + 7)
        .attr('fill', root.data.backgroundColor)
        .attr('stroke', root.data.borderColor)
        .attr('stroke-width', root.data.borderWidth)
        .style('stroke-dasharray', root.data.borderStyle === 'dashed' ? '4,2' : root.data.borderStyle === 'dotted' ? '1,2' : null);
      rootNode.append('text')
        .text(label)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', root.data.textColor)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('click', (event) => {
          event.stopPropagation();
          vm.selectedNode = root.data;       // chọn root node
        });
    },
    wrapText(textSel, maxWidth, lineHeight = 1.2) {
      textSel.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/);
        text.text(null);

        let line = [];
        const x = text.attr('x');
        const y = text.attr('y');
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
    drawBubbleMap(svg, treeData) {
    if (!treeData || !treeData.root) {
      console.error('Invalid treeData!', treeData);
      return;
    }
    const vm = this;

    // --- Build plain JS tree với .name, .id, .children ---
    const rootObj = {
      id:   'root',
      name: treeData.root,
      children: treeData.branches.map(br => ({
        id:       `b:${br.title}`,
        name:     br.title,
        children: br.subBranches.map(sb => ({
          id:   `b:${br.title}|s:${sb}`,
          name: sb
        }))
      }))
    };
    const root = d3.hierarchy(rootObj, d => d.children || []);

    // --- Layout đệ quy tính x,y,rDyn,fontSize, style defaults ---
    const w = svg.node().clientWidth, h = svg.node().clientHeight;
    const cx = w/2, cy = h/2;
    const padH = 8, linkLen1 = 120, linkLen2Base = 60, extraLeaf = 60;
    function layout(node, x, y, depth, baseAngle) {
      // tách chữ, tính rDyn, fontSize...
      const words = node.data.name.split(/\s+/);
      const lines = [];
      for (let i=0; i<words.length; i+=3)
        lines.push(words.slice(i,i+3).join(' '));
      const fontSize = depth===0?14: depth===1?12:10;
      const font = `${fontSize}px sans-serif`;
      const maxW = Math.max(...lines.map(l=>vm.textWidth(l,font)));
      const rDyn = Math.max(depth===0?80:40, maxW/2 + padH);

      // gán tọa độ + style mặc định
      node.data.x = x;
      node.data.y = y;
      node.data.rDyn = rDyn;
      node.data.fontSize = fontSize;
      node.data.fill            ||= depth===0?'aqua':'#fff';
      node.data.stroke          ||= depth===0?'#333':'#007bff';
      node.data.strokeWidth     ||= depth===0?2:1.5;
      node.data.textColor       ||= '#000';
      node.data.fontFamily      ||= 'sans-serif';
      node.data.isBold          = !!node.data.isBold;
      node.data.isItalic        = !!node.data.isItalic;
      node.data.borderColor     ||= node.data.stroke;
      node.data.borderWidth     ||= node.data.strokeWidth;
      node.data.borderStyle     ||= 'solid';
      node.data.backgroundColor ||= node.data.fill;

      // layout con
      const kids = node.children||[];
      if (!kids.length) return;
      const Nroot = root.children.length;
      const radSector = 2*Math.PI/Nroot;

      if (depth===0) {
        kids.forEach((kid,i) => {
          const θ = -Math.PI/2 + radSector/2 + i*radSector;
          const len = linkLen1;
          layout(kid, x + Math.cos(θ)*(rDyn+len), y + Math.sin(θ)*(rDyn+len), 1, θ);
        });
      } else {
        const startAng = baseAngle - radSector/2;
        kids.forEach((kid,i) => {
          const θ = startAng + radSector*(i/((kids.length-1)||1));
          let len = linkLen2Base + (kids.length-1)*20;
          if (!kid.children?.length) len += extraLeaf;
          layout(kid, x + Math.cos(θ)*(rDyn+len), y + Math.sin(θ)*(rDyn+len), depth+1, θ);
        });
      }
    }
    layout(root, cx, cy, 0, 0);

    // --- Build Vue arrays ---
    // 1) Nodes
    const nodes = root.descendants().map(d3n => ({
      id:              d3n.data.id,
      type:            d3n.data.type    || 'circle',
      text:            d3n.data.name,
      left:            d3n.data.x - d3n.data.rDyn,
      top:             d3n.data.y - d3n.data.rDyn,
      width:           d3n.data.rDyn * 2,
      height:          d3n.data.rDyn * 2,
      rotation:        0,
      backgroundColor: d3n.data.backgroundColor,
      borderColor:     d3n.data.borderColor,
      borderWidth:     d3n.data.borderWidth,
      borderStyle:     d3n.data.borderStyle,
      textColor:       d3n.data.textColor,
      fontSize:        d3n.data.fontSize,
      fontFamily:      d3n.data.fontFamily,
      isBold:          d3n.data.isBold,
      isItalic:        d3n.data.isItalic
    }));

    // 2) Links: parent → each child
    const links = [];
    root.descendants().forEach(d3n => {
      if (d3n.parent) {
        links.push({
          from:      d3n.parent.data.id,
          to:        d3n.data.id,
          marker:    'none',
          color:     '#333',
          thickness: 1.5,
          curvature: 0,
          dash:      'solid'
        });
      }
    });

    // 3) Gán state
    vm.nodes = nodes;
    vm.links = links;
  },


  drawFreeMap(svg) {
    const vm = this;
    // 0) Lấy rawData (đã đổ từ mounted):
    const rawData = vm.mindmapObject || { nodes: [], links: [] };

    // 1) Map rawData.nodes → this.nodes (để Vue template tự render <div class="node">)
    vm.nodes = (rawData.nodes || []).map(n => ({
      id:            String(n.id),                // QUAN TRỌNG: ép thành string
      type:          n.type       || 'rectangle', // ví dụ
      left:          Number(n.x)   || 0,          // CSS left
      top:           Number(n.y)   || 0,          // CSS top
      width:         Number(n.width)  || 120,
      height:        Number(n.height) || 80,
      rotation:      Number(n.rotation) || 0,
      text:          String(n.text || '').replace(/<[^>]+>/g,''), 
      fontFamily:    n.fontFamily || 'Arial',
      fontSize:      Number(n.fontSize) || 14,
      isBold:        !!n.isBold,
      isItalic:      !!n.isItalic,
      textColor:     n.textColor || '#000000',
      align:         n.align || 'center',
      borderColor:   n.borderColor   || '#000000',
      backgroundColor:n.backgroundColor || '#ffffff',
      borderWidth:   Number(n.borderWidth) || 1,
      borderStyle:   n.borderStyle || 'solid',
      imageUrl:      n.imageUrl || null,
      custom:        n.custom   || null
      // … nếu còn trường khác, hãy bổ sung tương tự …
    }));
    console.log('this.nodes = ', this.nodes.map(n => n.id));
    // 2) Map rawData.links → this.links (normalize to/toPos)
    vm.links = (rawData.links || []).map(l => {
      // QUAN TRỌNG: Ép from, to thành string để match với node.id
      const fromId = String(l.from);
      const toId   = (l.to != null && String(l.to) !== '') 
                       ? String(l.to) 
                       : null;

      if (toId) {
        // Link node→node: ép toPos = null
        return {
          id:         String(l.id || `${fromId}-${toId}-${Date.now()}`),
          from:       fromId,
          to:         toId,
          toPos:      null,
          attachedTo: toId,
          color:      l.color     || '#000000',
          thickness:  Number(l.thickness) || 2,
          dash:       l.dash      || 'solid',
          curvature:  Number(l.curvature) || 0,
          marker:     l.marker    || 'none',
          custom:     l.custom    || null
        };
      } else {
        // Free‐link: giữ nguyên toPos
        const x = l.toPos && Number(l.toPos.x) != null ? Number(l.toPos.x) : 0;
        const y = l.toPos && Number(l.toPos.y) != null ? Number(l.toPos.y) : 0;
        return {
          id:         String(l.id || `${fromId}-free-${Math.round(x)}_${Math.round(y)}`),
          from:       fromId,
          to:         null,
          toPos:      { x, y },
          attachedTo: null,
          color:      l.color     || '#000000',
          thickness:  Number(l.thickness) || 2,
          dash:       l.dash      || 'solid',
          curvature:  Number(l.curvature) || 0,
          marker:     l.marker    || 'none',
          custom:     l.custom    || null
        };
      }
    });

    // 3) Đợi Vue build xong DOM <div class="node"> với left/top/…,
    //    đồng thời Vue template cũng build các <g v-for="link in links">…
    vm.$nextTick(() => {
      // 4) Xóa tạm bất kỳ phần tử link do D3 cũ (nếu bạn từng append vào SVG)
      svg.selectAll('path.link').remove();
      svg.selectAll('circle.link-handle').remove();

      // *** Không vẽ gì thêm ở đây, vì Vue template đã chịu trách nhiệm render link ***
    });
  },


  // Hàm phụ để tính lại path khi drag node
  computeLinkPath(link, nodesById) {
    const s = nodesById[link.from];
    const t = link.to != null && nodesById[link.to]
      ? nodesById[link.to]
      : { x: link.toPos?.x, y: link.toPos?.y, width:0, height:0 };
      if (!s || !t || isNaN(s.x)||isNaN(s.y)||isNaN(t.x)||isNaN(t.y)) {
        return '';  // hoặc 'M0,0 L0,0' để không vẽ gì
      }
    const x1 = s.x + s.width/2,  y1 = s.y + s.height/2;
    const x2 = t.x + (t.width||0)/2, y2 = t.y + (t.height||0)/2;
    const dx = x2-x1, dy = y2-y1;
    const cpx = x1 + dx/2 - dy*(link.curvature||0);
    const cpy = y1 + dy/2 + dx*(link.curvature||0);
    return `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`;
  },
    _findNode(id, nodes) {
      const n = nodes.find(n => n.id === id);
      if (!n) {
        console.error(`_findNode: cannot find node with id="${id}"`, nodes);
        return { x: 0, y: 0 };
      }
      return n;
    },
    buildHierarchy(treeData) {
      const raw = {
        name: treeData.root,
        fill: treeData.fill,       // root cũng có thể có màu
        stroke: treeData.stroke,
        children: (treeData.branches || []).map(b => ({
          name: b.title,
          fill: b.fill,            // lấy màu gốc
          stroke: b.stroke,
          children: (b.subBranches || []).map(sb => ({
            name: sb.name || sb,
            fill: sb.fill,
            stroke: sb.stroke
          }))
        }))
      };
      const root = d3.hierarchy(raw, d => d.children);
      let id = 0;
      root.each(d => {
        d.data.id = id++;
        // khởi màu từ JSON, nếu không có mới fallback
        d.data.backgroundColor = d.data.fill != null
          ? d.data.fill
          : this.defaultNodeBackgroundColor;
        d.data.borderColor = d.data.stroke != null
          ? d.data.stroke
          : this.defaultNodeBorderColor;
        d.data.borderWidth = this.defaultNodeBorderThickness;
        d.data.borderStyle = this.defaultNodeBorderStyle;
        d.data.textColor = d.data.textColor ?? '#333';
        d.data.borderWidth = d.data.borderWidth ?? (d.depth === 0 ? 2 : 1.5);
      });
      return root;
    },
    textWidth(text) {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '12px sans-serif';
      return ctx.measureText(text).width;
    },
    drawFlowMap(svg) {
      const vm = this;

      // 1) reset + marker arrow
      svg.selectAll('*').remove();
      const defs = svg.append('defs');
      defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#888');

      // 2) container + zoom/pan
      const offsetX = 200, offsetY = 20;
      const g = svg.append('g')
        .attr('transform', `translate(${offsetX},${offsetY})`);
      svg.call(
        d3.zoom()
          .scaleExtent([0.1, 4])
          .on('zoom', ({ transform }) => g.attr('transform', transform))
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
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrow)')
        // chuẩn bị animation
        .attr('stroke-dasharray', function () {
          const L = this.getTotalLength();
          return `${L} ${L}`;
        })
        .attr('stroke-dashoffset', function () {
          return this.getTotalLength();
        })
        .transition()
        // delay theo depth để vẽ từ gốc trước, ra xa sau
        .delay(d => d.source.depth * 300)
        .duration(600)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

      // 6) wrap 4 từ 1 dòng
      function wrap4(text) {
        const words = text.split(/\s+/), lines = [];
        for (let i = 0; i < words.length; i += 3) {
          lines.push(words.slice(i, i + 3).join(' '));
        }
        return lines;
      }

      // 7) draw nodes
      const nodes = g.selectAll('g.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => {
          const extraX = d.depth === 1 ? 100 : 0;
          return `translate(${d.y + extraX},${d.x})`;
        });

      // 8) root node
      nodes.filter(d => d.depth === 0)
        .each((d, i, els) => {
          const nd = d3.select(els[i]);
          const lines = wrap4(d.data.name);
          const font = '16px sans-serif';
          const maxW = Math.min(200,
            Math.max(...lines.map(l => vm.textWidth(l, font)))
          );
          const r = maxW / 2 + 20;

          nd.append('circle')
            .attr('r', r)
            .attr('fill', '#fff')
            .attr('stroke', '#333')
            .attr('stroke-width', 4);

          const textEl = nd.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', font)
            .style('font-weight', 'bold');

          lines.forEach((ln, idx) => {
            textEl.append('tspan')
              .attr('x', 0)
              .attr('dy', idx === 0 ? `-${(lines.length - 1) * 0.6}em` : '1.2em')
              .text(ln);
          });
        });

      // 9) non-root nodes (depth >= 1)
      nodes.filter(d => d.depth >= 1)
        .each((d, i, els) => {
          const nd = d3.select(els[i]);
          const lines = wrap4(d.data.name);
          const font = '12px sans-serif';
          const padH = 6, padV = 4;
          const maxW = Math.max(...lines.map(l => vm.textWidth(l, font)));
          const wRect = maxW + padH * 6;
          const hRect = lines.length * 20 + padV * 2;

          nd.append('rect')
            .attr('x', d.children ? -wRect - 4 : 4)
            .attr('y', -hRect / 2)
            .attr('width', wRect)
            .attr('height', hRect)
            .attr('rx', 4).attr('ry', 4)
            .attr('fill', '#f9f9f9')
            .attr('stroke', '#007bff')
            .attr('stroke-width', 1.5);

          const textEl = nd.append('text')
            .attr('text-anchor', d.children ? 'end' : 'start')
            .attr('dominant-baseline', 'middle')
            .style('font-size', font);
          if (this.includeImage && this.leafImages[d.data.name]) {
            const xOff = d.children
              ? -wRect - 10 // trái
              : wRect + 10;      // phải
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
              .attr('dy', idx === 0 ? `-${(lines.length - 1) * 0.6}em` : '1.2em')
              .text(ln);
          });
        });
      if (this.includeImage) {
        const leafSelection = nodes
          .filter(d =>
            !d.children &&
            this.includeImage &&
            this.leafImages[d.data.name]
          );

        console.log('Leaf nodes for image:', leafSelection.size());
        leafSelection.append('image')
          .attr('href', d => this.leafImages[d.data.name])
          .attr('x', 25)
          .attr('y', -25)
          .attr('width', 50)
          .attr('height', 50);
      }
    },
    drawMultiFlowMap(svg) {
      const vm = this;
      const w = svg.node().clientWidth;
      const h = svg.node().clientHeight;

      // 1) Clear & marker
      svg.selectAll('*').remove();
      const defs = svg.append('defs');
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

      // 2) Container + zoom/pan
      const g = svg.append('g')
        .attr('transform', `translate(${w / 2},${h / 2})`);
      svg.call(
        d3.zoom().scaleExtent([0.1, 4])
          .on('zoom', ({ transform }) => g.attr('transform', transform))
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
      const treeObj = vm.buildHierarchy(vm.mindmapObject);
      const allKids = treeObj.children || [];
      const half = Math.ceil(allKids.length / 2);
      const leftKids = allKids.slice(0, half);
      const rightKids = allKids.slice(half);
      const leftRoot = d3.hierarchy({ children: leftKids }, d => d.children);
      const rightRoot = d3.hierarchy({ children: rightKids }, d => d.children);

      // 5) Layout
      const vert = 100, hor = 300;
      const layout = d3.tree().nodeSize([vert, hor]).separation((a, b) => a.parent === b.parent ? 1 : 2);
      layout(leftRoot);
      layout(rightRoot);

      // 6) Vertical center
      const leftYs = leftRoot.descendants().map(d => d.x);
      const rightYs = rightRoot.descendants().map(d => d.x);
      const leftMid = (d3.min(leftYs) + d3.max(leftYs)) / 2;
      const rightMid = (d3.min(rightYs) + d3.max(rightYs)) / 2;

      // 7) Root metrics & shift
      const rootLines = wrap4(treeObj.name);
      const font0 = '16px sans-serif';
      const maxRW = Math.min(200, Math.max(...rootLines.map(l => vm.textWidth(l, font0))));
      const r0 = maxRW / 2 + 20;
      const rootShiftX = 30;

      // 8) Text & marker params
      const textFont = '12px sans-serif';
      const padH = 6;
      const padV = 4;
      const markerAdjust = 4;
      const marginLeft = -80;
      const marginRight = 100;

      // compute arrow shift to touch node border
      function computeShift(name) {
        const lines = wrap4(name);
        const maxW = Math.max(...lines.map(l => vm.textWidth(l, textFont)));
        const rectW = maxW + padH * 6;
        return rectW / 2 + markerAdjust;
      }

      // 9) Draw links under nodes
      const doLinks = (root, flip) => {
        const linkGen = d3.linkHorizontal()
          .x(d => flip ? -d.y : d.y)
          .y(d => d.x);
        g.append('g').selectAll('path.link').data(root.links()).enter().append('path')
          .attr('class', 'link')
          .attr('fill', 'none')
          .attr('stroke', '#999')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrow)')
          .attr('stroke-dasharray', function () { const L = this.getTotalLength(); return `${L} ${L}`; })
          .attr('stroke-dashoffset', function () { return this.getTotalLength(); })
          .attr('d', d => {
            const vSrc = d.source.x - (flip ? rightMid : leftMid);
            const vTgt = d.target.x - (flip ? rightMid : leftMid);
            const hSrc = d.source.y + (d.source.depth === 0 ? (flip ? -r0 : r0) : 0);
            let hTgt = d.target.y;
            const shift = computeShift(d.target.data.name);
            if (!flip && d.target.depth === 1) hTgt += shift;
            if (flip && !d.target.children) hTgt -= shift;
            return linkGen({ source: { x: vSrc, y: hSrc }, target: { x: vTgt, y: hTgt } });
          })
          .transition().delay(d => d.source.depth * 300).duration(600).ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);
      };
      doLinks(leftRoot, true);
      doLinks(rightRoot, false);

      // 10) Draw root above links
      const rootG = g.append('g').attr('transform', `translate(${rootShiftX},0)`);
      rootG.append('circle')
        .attr('r', r0)
        .attr('fill', '#fff')
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
          .attr('class', 'node')
          .attr('transform', d => {
            const v = d.x - (flip ? rightMid : leftMid);
            let h = d.y;
            if (!flip && d.depth === 1) h += marginRight;
            if (flip && !d.children) h -= marginLeft;
            const x = flip ? -h : h;
            return `translate(${x},${v})`;
          })
          .each(function (d) {
            const nd = d3.select(this);
            const lines = wrap4(d.data.name);
            const maxW = Math.max(...lines.map(l => vm.textWidth(l, textFont)));
            const wRect = maxW + padH * 8;
            const hRect = lines.length * 20 + padV * 2;
            nd.append('rect')
              .attr('x', d.children ? -wRect - 4 : 4)
              .attr('y', -hRect / 2)
              .attr('width', wRect)
              .attr('height', hRect)
              .attr('rx', 4).attr('ry', 4)
              .attr('fill', '#f9f9f9')
              .attr('stroke', '#007bff')
              .attr('stroke-width', 1.5);
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
        .attr('transform', `translate(${w / 2},20)`);
      svg.call(
        d3.zoom()
          .scaleExtent([0.5, 3])
          .on('zoom', ({ transform }) => {
            g.attr('transform', `translate(${transform.x + w / 2},${transform.y + 20}) scale(${transform.k})`);
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
        .each(function () {
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

      nodes.each(function (d) {
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
          .attr('rx', pad / 2)
          .attr('ry', pad / 2)
          .attr('fill', 'white')
          .attr('stroke', 'purple')
          .attr('stroke-width', strokeWidth);
      });

      nodes.transition()
        .delay(d => d.depth * 300 + 600)
        .duration(600)
        .attr('opacity', 1);

    },
    selectTemplate(key) {
      const tpl = this.templates.find(t => t.key === key)
      if (!tpl) return
      this.selectedTemplate = tpl
      this.nodes = JSON.parse(JSON.stringify(tpl.nodes)),
        this.links = JSON.parse(JSON.stringify(tpl.links))
    },
    zoomIn() {
      this.scale = Math.min(this.scale + this.scaleStep, this.maxScale);
      this.pushHistory()
    },
    zoomOut() {
      this.scale = Math.max(this.scale - this.scaleStep, this.minScale);
      this.pushHistory()
    },
    onWheel(e) {
      if (e.deltaY > 0) {
        this.zoomOut();
      } else {
        this.zoomIn();
      }
      this.pushHistory()
    },
    // UNDO / REDO
    pushHistory() {
      // đảm bảo nodes/links luôn là mảng
      const nodes = Array.isArray(this.nodes) ? this.nodes : [];
      const links = Array.isArray(this.links) ? this.links : [];

      // truncate forward
      this.history.splice(this.historyIndex + 1);

      // deep clone current state
      const snapshot = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        links: JSON.parse(JSON.stringify(links)),
        scale: this.scale
      };

      this.history.push(snapshot);
      this.historyIndex = this.history.length - 1;
    },
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restore(this.history[this.historyIndex]);
      }
    },
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.restore(this.history[this.historyIndex]);
      }
    },
    restore(snapshot) {
      this.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
      this.links = JSON.parse(JSON.stringify(snapshot.links));
      if (snapshot.scale !== undefined) this.scale = snapshot.scale;
    },
    addNode(node) {
      this.nodes.push(node);
      this.pushHistory();
    },
    mounted() {
      // initialize history with empty state
      this.pushHistory();
    },
    startDragEnd(link) {
      this.draggingLinkEnd = link;
      window.addEventListener('mousemove', this.trackDragEnd);
      window.addEventListener('mouseup', this.stopDragEnd);
    },

    // **2) Khi di chuột, cập nhật toPos của link**
    trackDragEnd(evt) {
      if (!this.draggingLinkEnd) return;
      const rect = this.$refs.canvas.getBoundingClientRect();
      this.draggingLinkEnd.toPos = {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
      this.draggingLinkEnd.attachedTo = null;
    },

    // **3) Khi thả chuột, kết thúc drag**
    stopDragEnd() {
      window.removeEventListener('mousemove', this.trackDragEnd);
      window.removeEventListener('mouseup', this.stopDragEnd);
      this.draggingLinkEnd = null;
    },
    getLinkEnd(link) {
      // nếu là free-pos
      if (link.toPos) {
        return { x: link.toPos.x, y: link.toPos.y };
      }
      // còn lại là node → node
      const endNode = this.nodes.find(n => n.id === link.to);
      if (!endNode) return { x: 0, y: 0 };
      return {
        x: endNode.left + endNode.width / 2,
        y: endNode.top + endNode.height / 2
      };
    },
    computeTaperedBranch(link) {
  // 1) Lấy tọa độ start/end
  const start = this.getNodeCenter(link.from);
  const end   = link.toPos
    ? { x: link.toPos.x, y: link.toPos.y }
    : this.getNodeCenter(link.to);
  if (!start || !end) return '';

  // 2) Tính Bézier Q control-point có offset theo curvature
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const len = Math.hypot(dx, dy) || 1;
  // Vector pháp tuyến (unit)
  const ux = -dy / len;
  const uy =  dx / len;
  // Offset = curvature * len (nhúng curvature vào đây)
  const offset = (link.curvature || 0) * len;
  const cx = mx + ux * offset;
  const cy = my + uy * offset;

  // 3) Chia thành N segment để tạo taper
  const N = 30;
  const leftPts  = [];
  const rightPts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Công thức Q-bezier
    const x = (1 - t)**2 * start.x
            + 2 * (1 - t) * t * cx
            + t**2 * end.x;
    const y = (1 - t)**2 * start.y
            + 2 * (1 - t) * t * cy
            + t**2 * end.y;
    // Vector pháp tuyến (không đổi)
    const nx = ux;
    const ny = uy;
    // Độ rộng taper: đầu = thickness, cuối = 0
    const w = (link.thickness || 2) * (1 - t);
    leftPts.push (`${x + nx * w/2},${y + ny * w/2}`);
    rightPts.unshift(`${x - nx * w/2},${y - ny * w/2}`);
  }

  // 4) Ghép thành path đóng
  return `M${leftPts.join('L')}L${rightPts.join('L')}Z`;
},
    midPoint(link) {
      const start = this.getNodeCenter(link.from);
      const end = link.toPos
        ? { x: link.toPos.x, y: link.toPos.y }
        : this.getNodeCenter(link.to);
      if (!start || !end) return { x: 0, y: 0 };

      // Nếu link.curvature = 0, mid là trung điểm
      if (!link.curvature) {
        return {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2
        };
      }

      // Với đường cong Q, mid trượt theo normal
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const ux = -dy / len;
      const uy = dx / len;
      return {
        x: mx + ux * (link.curvature * len),
        y: my + uy * (link.curvature * len)
      };
    },
    startAdjustCurvature(link) {
      this.adjustingLink = link;
      window.addEventListener('mousemove', this.adjustCurvature);
      window.addEventListener('mouseup', this.endAdjustCurvature);
    },

    adjustCurvature(evt) {
      if (!this.adjustingLink) return;
      const link = this.adjustingLink;

      // Lấy tọa độ start/end, hỗ trợ cả node→node và node→pos
      const start = this.getNodeCenter(link.from);
      const end = link.toPos
        ? { x: link.toPos.x, y: link.toPos.y }
        : this.getNodeCenter(link.to);

      if (!start || !end) return;   // guard nếu null

      // Lấy mouse trong canvas
      const rect = this.$refs.canvas.getBoundingClientRect();
      const mx = evt.clientX - rect.left;
      const my = evt.clientY - rect.top;

      // Tính normal
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = -dy / len;
      const uy = dx / len;

      // Midpoint không cong (curvature=0)
      const mid0 = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      };

      // Vector từ mid0 tới con trỏ
      const vx = mx - mid0.x;
      const vy = my - mid0.y;

      // Vặn curvature: signed distance trên normal
      link.curvature = (vx * ux + vy * uy) / len;
    },

    endAdjustCurvature() {
      window.removeEventListener('mousemove', this.adjustCurvature);
      window.removeEventListener('mouseup', this.endAdjustCurvature);
      this.adjustingLink = null;
    },
    selectLink(link) {
      console.log('Chọn link:', link)
      this.selectedLink = link;
      this.selectedNode = null;  // bỏ chọn node khi chọn link
    },
    clearSelection() {
      this.selectedNode = null;
      this.selectedLink = null;
    },
    handleNodeClick(node) {
    if (!this.linking.active) {
      this.selectNode(node);
    }
  },

  // duy nhất một chỗ set selectedNode và panel
  selectNode(node) {
    this.selectedNode        = node;
    this.selectedLink        = null;                // clear link selection
    this.selectedColor       = node.textColor  || '#000000';
    this.selectedFont        = node.fontFamily || 'Arial';
    this.selectedAlign       = node.align      || 'center';
    this.nodeBorderColor     = node.borderColor;
    this.nodeBackgroundColor = node.backgroundColor;
    this.nodeBorderThickness = node.borderWidth;
    this.nodeBorderStyle     = node.borderStyle;

    // nếu bạn có muốn apply style lên chính element ngay
    this.updateNodeStyle(node);
  },

  // tương tự với link
  handleLinkClick(link) {
    this.selectionLink(link);
  },

  selectionLink(link) {
    this.selectedLink     = link;
    this.selectedNode     = null;                  // clear node selection
    this.linkColor        = link.color;
    this.linkThickness    = link.thickness;
    this.linkDash         = link.dash;
    this.linkCurvature    = link.curvature;
    this.linkMarker       = link.marker;
  },

  initSelection() {
    if (this.nodes.length) this.selectNode(this.nodes[0]);
    if (this.links.length) this.selectionLink(this.links[0]);
  },
    dragStart(type) {
      this.currentDrag = type;
    },
    drop(event) {
      event.preventDefault();

      // Lấy loại drag hiện tại
      const type = this.currentDrag;
      if (!type) return;

      // Tính toạ độ relative so với canvas
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Nếu là image, để handleFileSelect xử lý
      if (type === 'image') {
        // bạn có thể bật file input ở đây nếu muốn
        this.uploadImage();
      } else {
        // chuẩn bị node mới
        const newNode = {
          id: idCounter++,
          type: type,                   // rectangle, circle, diamond, label
          left: x,
          top: y,
          width: type === 'label' ? 100 : 120,
          height: type === 'label' ? 40 : 80,
          text: type === 'label' ? 'Nhập text...' : '',
          rotation: 0,

          // Font mặc định
          font: {
            family: 'Arial',
            size: 14,
            bold: false,
            italic: false,
            color: '#000000',
            align: 'center'
          },

          // Style mặc định
          style: {
            borderColor: '#000000',
            borderWidth: this.defaultNodeBorderThickness,  // hoặc 1
            borderStyle: this.defaultNodeBorderStyle,      // hoặc 'solid'
            backgroundColor: '#ffffff',
            custom: {}
          },

        };

        this.nodes.push(newNode);
      }

      // reset trạng thái drag
      this.currentDrag = null;
    },
    removeNode(nodeToRemove) {
      this.pushHistory();
    // 1) Xác định node mục tiêu (nếu không truyền vào thì lấy selected)
    const target = nodeToRemove || this.selectedNode;
    if (!target) return;

    // 2) Tập hợp tất cả id cần xoá (target + descendants)
    const toDelete = new Set([target.id]);
    let changed;
    do {
      changed = false;
      this.links.forEach(l => {
        if (toDelete.has(l.from) && !toDelete.has(l.to)) {
          toDelete.add(l.to);
          changed = true;
        }
      });
    } while (changed);

    // 3) Lọc nodes, links
    this.nodes = this.nodes.filter(n => !toDelete.has(n.id));
    this.links = this.links.filter(
      l => !toDelete.has(l.from) && !toDelete.has(l.to)
    );

    // 4) Reset selection & linking
    this.selectedNode = null;
    this.selectedLink = null;
    if (this.linking) {
      this.linking.active   = false;
      this.linking.fromNode = null;
      this.linking.tempPos  = { x: 0, y: 0 };
    }

    // 5) Đẩy lịch sử nếu cần
    this.pushHistory();
  },
    uploadImage() {
      document.getElementById('imageUploader').click();
    },
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          this.nodes.push({
            id: idCounter++,
            type: 'image',
            left: 50,
            top: 50,
            width: 150,
            height: 100,
            image: dataUrl,
            borderColor: this.defaultNodeBorderColor,
            backgroundColor: this.defaultNodeBackgroundColor,
            borderThickness: this.defaultNodeBorderThickness,
            borderStyle: this.defaultNodeBorderStyle
          });
        };
        reader.readAsDataURL(file);
      }
    },
    updateNodeText(evt, node) {
      node.text = evt.target.innerHTML;
      // đảm bảo style vẫn giữ
      this.updateNodeStyle(node);
    },
    toggleBold() {
      console.log('toggleBold called, selectedNode =', this.selectedNode);
      if (this.selectedNode) {
        this.selectedNode.isBold = !this.selectedNode.isBold;
        document.execCommand('bold');
        this.updateNodeStyle(this.selectedNode);
        this.updateText(this.selectedNode);
      }
    },

    toggleItalic() {
      if (this.selectedNode) {
        this.selectedNode.isItalic = !this.selectedNode.isItalic;
        document.execCommand('italic');
        this.updateNodeStyle(this.selectedNode);
        this.updateText(this.selectedNode);
      }
    },

    applyFontFamily() {
      if (this.selectedNode) {
        this.selectedNode.fontFamily = this.selectedFont;
        this.updateNodeStyle(this.selectedNode);
        this.updateText(this.selectedNode);
      }
    },

    applyTextColor() {
      if (this.selectedNode) {
        this.selectedNode.textColor = this.selectedColor;
        this.updateNodeStyle(this.selectedNode);
        this.updateText(this.selectedNode);
      }
    },

    setAlign(dir) {
      if (this.selectedNode) {
        this.selectedNode.align = dir;
        this.selectedAlign = dir;
        document.execCommand(
          dir === 'left' ? 'justifyLeft' :
            dir === 'center' ? 'justifyCenter' :
              'justifyRight'
        );
        this.updateNodeStyle(this.selectedNode);
        this.updateText(this.selectedNode);
      }
    },

    // Tái áp dụng style lên nội dung <div contenteditable>
    updateNodeStyle(node) {
      // set inline styles
      this.$nextTick(() => {
        const el = this.$el.querySelector(`.node[data-id="${node.id}"] .shape-inner`);
        if (!el) return;
        el.style.fontWeight = node.isBold ? 'bold' : 'normal';
        el.style.fontStyle = node.isItalic ? 'italic' : 'normal';
        el.style.fontFamily = node.fontFamily || '';
        el.style.color = node.textColor;
        el.style.textAlign = node.align || 'center';
      });
    },
    updateNode(node) {
      this.drawFreeMap(this.svg);
      if (!node || node.id == null) {
        console.warn('Không có node để cập nhật', node);
        return;
      }
      node.backgroundColor = this.nodeBackgroundColor;
      node.borderColor = this.nodeBorderColor;
      node.borderWidth = this.nodeBorderThickness;
      node.borderStyle = this.nodeBorderStyle;
      console.log('updateNodeStyle', node.id, node.borderWidth);
      const sel = d3.select(this.$refs.canva)
        .select(`g.node-group[data-id='${node.id}']`);
      console.log(d3.select(this.$refs.canvas).selectAll('g.node-group').nodes());
      if (sel.empty()) {
        console.warn('Không tìm thấy node-group với id', node.id);
        return;
      }
      sel.selectAll('circle.node-shape, ellipse.node-shape, rect.node-shape')
        .attr('fill', node.backgroundColor)
        .attr('stroke', node.borderColor)
        .attr('stroke-width', node.borderWidth)
        .attr('stroke-dasharray',
          node.borderStyle === 'dashed' ? '4,2'
            : node.borderStyle === 'dotted' ? '1,2'
              : null
        );
    },
    updateText(node) {
      console.log('updateText', node.id, node.textColor);
      const sel = d3.select(this.$refs.canva)
        .select(`g.node-group[data-id='${node.id}']`);
      sel.select('text')
        // .attr('text-anchor',    node.align)
        .attr('font-size', `${node.fontSize}px`)
        .attr('font-weight', node.isBold ? 'bold' : 'normal')
        .attr('font-style', node.isItalic ? 'italic' : 'normal')
        .style('fill', node.textColor)
        .attr('font-family', node.fontFamily);
    },
    updateLink(link) {
      this.drawFreeMap(this.svg);
      if (!link || link.from == null) return;  // << guard ở đây
      const sel = d3.select(this.$refs.canvas)
        // .select(`line[data-from='${link.from}'][data-to='${link.to}']`)
        .select(`path.link[data-id="${link.id}"]`);
      sel
        .attr('stroke', link.color)
        .attr('stroke-width', link.thickness)
        .attr('stroke-dasharray', this.dashArray(link.dash))
        .attr('marker-end', link.marker === 'none' ? null : `url(#${link.marker})`);
    },
    startDragNode(node, event) {
      if (this.linkMode) return;
      this.draggingNode = node;
      this.offsetX = event.clientX - node.left;
      this.offsetY = event.clientY - node.top;
      window.addEventListener('mousemove', this.doDragNode);
      window.addEventListener('mouseup', this.stopDragNode);
    },
    doDragNode(event) {
      if (!this.draggingNode) return;
      // di chuyển node
      this.draggingNode.left = event.clientX - this.offsetX;
      this.draggingNode.top = event.clientY - this.offsetY;

      // tâm node mới
      const cx = this.draggingNode.left + this.draggingNode.width / 2;
      const cy = this.draggingNode.top + this.draggingNode.height / 2;

      // cập nhật các link gắn vào node này
      this.links.forEach(link => {
        if (link.attachedTo === this.draggingNode.id) {
          link.toPos.x = cx;
          link.toPos.y = cy;
        }
      });
    },
    stopDragNode() {
      window.removeEventListener('mousemove', this.doDragNode);
      window.removeEventListener('mouseup', this.stopDragNode);
      this.draggingNode = null;
    },
    startResize(node, event, dir) {
      this.resizingNode = node;
      this.resizeDir = dir;
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.startW = node.width;
      this.startH = node.height;
      this.startL = node.left;
      this.startT = node.top;
      window.addEventListener('mousemove', this.doResize);
      window.addEventListener('mouseup', this.stopResize);
    },
    doResize(event) {
      if (!this.resizingNode) return;
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      let newW = this.startW;
      let newH = this.startH;
      let newL = this.startL;
      let newT = this.startT;
      switch (this.resizeDir) {
        case 'top-left':
          newW = Math.max(30, this.startW - dx);
          newH = Math.max(30, this.startH - dy);
          newL = this.startL + dx;
          newT = this.startT + dy;
          break;
        case 'top-center':
          newH = Math.max(30, this.startH - dy);
          newT = this.startT + dy;
          break;
        case 'top-right':
          newW = Math.max(30, this.startW + dx);
          newH = Math.max(30, this.startH - dy);
          newT = this.startT + dy;
          break;
        case 'mid-left':
          newW = Math.max(30, this.startW - dx);
          newL = this.startL + dx;
          break;
        case 'mid-right':
          newW = Math.max(30, this.startW + dx);
          break;
        case 'bottom-left':
          newW = Math.max(30, this.startW - dx);
          newH = Math.max(30, this.startH + dy);
          newL = this.startL + dx;
          break;
        case 'bottom-center':
          newH = Math.max(30, this.startH + dy);
          break;
        case 'bottom-right':
          newW = Math.max(30, this.startW + dx);
          newH = Math.max(30, this.startH + dy);
          break;
      }
      this.resizingNode.width = newW;
      this.resizingNode.height = newH;
      this.resizingNode.left = newL;
      this.resizingNode.top = newT;
    },
    stopResize() {
      window.removeEventListener('mousemove', this.doResize);
      window.removeEventListener('mouseup', this.stopResize);
      this.resizingNode = null;
      this.resizeDir = null;
    },
    getNodeCenter(nodeOrId) {
      // nếu truyền thẳng node object thì xài luôn
      const node = typeof nodeOrId === 'object'
        ? nodeOrId
        : this.nodes.find(n => n.id === nodeOrId);

      if (!node) return null;   // không tìm thấy → null
      return {
        x: node.left + node.width / 2,
        y: node.top + node.height / 2
      };
    },
    // Trả về style cho shape-inner, nơi hiển thị hình dạng thực của node
    shapeInnerStyle(node) {
      if (node.type === 'label') {
        return {
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          fontWeight: node.isBold ? 'bold' : 'normal',
          fontStyle: node.isItalic ? 'italic' : 'normal',
          fontFamily: node.fontFamily || '',
          color: node.textColor || '#000',
          textAlign: node.align || 'center',
        };
      }
      const borderColor = node.borderColor || this.defaultNodeBorderColor;
      const borderThickness = node.borderThickness !== undefined ? node.borderThickness : this.defaultNodeBorderThickness;
      const borderStyle = node.borderStyle || this.defaultNodeBorderStyle;
      const backgroundColor = node.backgroundColor || this.defaultNodeBackgroundColor;
      let style = {
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '5px',
        textAlign: 'center',
        whiteSpace: 'normal',
        wordWrap: 'break-word'
      };
      if (node.type === 'circle') {
        style.borderRadius = '50%';
        style.border = borderThickness + 'px ' + borderStyle + ' ' + borderColor;
      } else {
        style.borderRadius = '5px';
        style.border = borderThickness + 'px ' + borderStyle + ' ' + borderColor;
      }
      return style;
    },
    beginLink(node, evt) {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      this.linking.active = true;
      this.linking.fromNode = node;
      this.linking.tempPos = {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };

      window.addEventListener('mousemove', this.trackLink);
      window.addEventListener('mouseup', this.endLink);
    },

    trackLink(evt) {
      if (!this.linking.active) return;
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      this.linking.tempPos = {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    },

    // Kết thúc vẽ: nếu mouseup trên một node khác thì tạo link
    endLink(evt) {
      if (!this.linking.fromNode) return;
      // … xác định đích …
      const el = document.elementFromPoint(evt.clientX, evt.clientY);
      const nodeEl = el && el.closest('.node');
      const rect = this.$refs.canvas.getBoundingClientRect();
      if(!nodeEl) alert('Không thể nối ạ!!!')
      if (nodeEl) {
        // nối node→node
        const toId = Number(nodeEl.dataset.id);
        const center = this.getNodeCenter(toId);
        if (!center) {
          alert('Không thể nối ngược node với id = ' + toId);
          this.linking = {};
          return;
        }
        this.links.push({
          from: this.linking.fromNode.id,
          toPos: { x: center.x, y: center.y },
          attachedTo: toId,
          color: this.defaultLinkColor,
          thickness: this.defaultLinkThickness,
          dash: this.defaultLinkDash,
          curvature: this.defaultLinkCurvature,
          marker: this.defaultLinkMarker
        });
      } else {
        // nối node→free‐pos
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        if (x < 0 || y < 0) {
          alert('Vị trí vẽ link không hợp lệ.');
          this.linking = {};
          return;
        }
        this.links.push({
          from: this.linking.fromNode.id,
          toPos: { x, y },
          attachedTo: null,
          color: this.defaultLinkColor,
          thickness: this.defaultLinkThickness,
          dash: this.defaultLinkDash,
          curvature: this.defaultLinkCurvature,
          marker: this.defaultLinkMarker
        });
      }

      this.linking.active = false;
      this.linking.fromNode = null;
    },
    getLinkPath(fromId, to, isPos = false, curvature = 0) {
      const start = this.getNodeCenter(fromId);
      const end = isPos
        ? to
        : this.getNodeCenter(to);

      // Nếu thiếu start hoặc end thì không vẽ đường
      if (!start || !end) {
        return '';
      }

      // Nếu thẳng
      if (curvature === 0) {
        return `M${start.x},${start.y} L${end.x},${end.y}`;
      }

      // Cong Bézier Q
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const len = Math.hypot(dx, dy) || 1;
      const ux = -dy / len, uy = dx / len;
      const cx = mx + ux * curvature * len;
      const cy = my + uy * curvature * len;

      return `M${start.x},${start.y} Q${cx},${cy} ${end.x},${end.y}`;
    },
    dashArray(dash) {
      return dash === 'dashed' ? '5,5'
        : dash === 'dotted' ? '2,2'
          : '';
    },
    inlineAllStyles(el) {
      const recurse = node => {
        const cs = getComputedStyle(node);
        ['fill', 'stroke', 'font-size', 'font-family', 'font-weight', 'opacity']
          .forEach(prop => node.style.setProperty(prop, cs.getPropertyValue(prop)));
        for (let c of node.children) recurse(c);
      };
      recurse(el);
    },
    async exportImage() {
      const svgEl = this.$refs.canvas;
      if (!svgEl) return;

      // 1) Gán width/height nếu chưa có (cộng thêm padding nếu cần)
      svgEl.setAttribute('width', svgEl.clientWidth + 1000);
      svgEl.setAttribute('height', svgEl.clientHeight + 400);

      // 2) Inline tất cả style (giữ nguyên hàm của bạn)
      this.inlineAllStyles(svgEl);

      // 3) Dùng html-to-image để xuất PNG
      try {
        const dataUrl = await htmlToImage.toPng(svgEl, {
          backgroundColor: 'white',
          width: svgEl.clientWidth + 1000,
          height: svgEl.clientHeight + 400,
          pixelRatio: 2,           // scale = 2×
          // filter: node => …     // nếu muốn loại trừ node nào đó
        });

        // Tạo link download
        const link = document.createElement('a');
        link.download = `${this.form.mapTitle || 'mindmap'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (err) {
        console.error('Lỗi khi xuất ảnh:', err);
      }
    },
  }
}
</script>


<style scoped>
template {
  height: 100%;
  margin: 0;
}

.mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgb(77, 70, 70), aqua);
  display: flex;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 10px;
  width: 60%;
}

.toolbar-right {
  width: 40%;
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  font-weight: bolder;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-btn:hover {
  background: yellow;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toolbar-btn i {
  width: 18px;
  height: 18px;
}

.ai-button a {
  text-decoration: none;
  color: #1f2937;
  font-weight: bolder;
}

.ai-button a:hover {
  color: #6366f1;
}

.content {
  display: flex;
  flex: 1;
  gap: 20px;
  width: 1440px;
}

.left-panel {
  width: 280px;
  padding: 20px;
  height: 100%;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.left-panel h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.node-shapes {
  margin-bottom: 10px;
}

.node-shapes h3 {
  margin-bottom: 5px;
}

.node-shapes .shape {
  display: flex;
}

.fomat {
  display: flex;
}

.shape-option {
  width: 25px;
  height: 25px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 0;
  cursor: grab;
  transition: all 0.3s ease;
  margin-left: 5px;
}

.shape-option:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
}

.text-formatting {
  margin-bottom: 10px;
}

.format-btn {
  width: 30px;
  height: 30px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 3px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.format-btn.active {
  background: #6366f1;
  color: white;
}

.style-select {
  width: 100%;
  padding: 5px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  margin: 5px 0;
}

.color-picker {
  width: 10%;
  padding: 8px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  margin: 5px 3px;
  background: linear-gradient(red, blue, green);
  opacity: 60%;
}

.node-style {
  display: flex;
}

.number-input {
  width: 10%;
  padding: 8px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  margin: 5px 0;
}

.canvas {
  flex: 1;
  position: relative;
  background: #f8fafc;
  overflow: auto;
  border-left: 1px solid #e5e7eb;
  padding: 30px auto;
  width: 100%;
  height:1050px;
}
.link-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 1;
  /* thấp hơn các node */
}

.link-canvas line,
.link-canvas path {
  pointer-events: all;
  cursor: pointer;
}

.link--selected {
  opacity: 0.7;
}

.node--disabled {
  pointer-events: none;
}

.node {
  position: absolute;
  background: transparent;
  border: none;
  user-select: none;
  overflow: visible;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
}

.shape-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.shape-inner.rectangle {
  border-radius: 8px;
}

.shape-inner.circle {
  border-radius: 50%;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #6366f1;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.resize-handle:hover {
  background: #8b5cf6;
}

.resize-handle.top-left {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-handle.top-center {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle.top-right {
  top: -6px;
  right: -10px;
  cursor: ne-resize;
}

.resize-handle.mid-left {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-handle.mid-right {
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-handle.bottom-left {
  bottom: -10px;
  left: -6px;
  cursor: sw-resize;
}

.resize-handle.bottom-center {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle.bottom-right {
  bottom: -10px;
  right: -10px;
  cursor: se-resize;
}

.link-handle {
  position: absolute;
  top: 30%;
  right: -20px;
  /* kéo ra ngoài viền node một chút */
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 16px;
  cursor: crosshair;
  user-select: none;
  z-index: 10;
  /* đảm bảo nó nằm trên shape-inner */
  font-weight: bold;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
}

.modal h3 {
  margin: 0 0 10px;
}

.modal input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  box-sizing: border-box;
}

.modal-actions {
  text-align: right;
}

.modal-actions button {
  margin-left: 8px;
  padding: 6px 12px;
}

.rotate-handle {
  width: 12px;
  height: 12px;
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
  top: -20px;
  left: calc(50% - 6px);
  cursor: grab;
  z-index: 10;
}

.rotate-handle:active {
  cursor: grabbing;
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    overflow-y: auto;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px;
  }

  .canvas {
    width: 100%;
    height: calc(100vh - 200px);
  }
}
</style>