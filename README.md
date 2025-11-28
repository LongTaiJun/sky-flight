# ✈️ Sky Flight | 天际飞行

[English](#english) | [中文](#中文)

---

## English

### 🎮 About

**Sky Flight** is a web-based 3D flight simulator game built with Three.js. Experience realistic flying around a beautifully rendered Earth with day/night cycles, explore 100+ international airports, and enjoy smooth controls on both PC and mobile devices.

Inspired by the simplicity of fly.pieter.com combined with the realism of Microsoft Flight Simulator.

### ✨ Features

- 🌍 **3D Earth Rendering** - High-quality satellite textures with atmospheric glow effects
- 🌓 **Day/Night System** - Real-time lighting based on aircraft position with city lights at night
- ✈️ **Multiple Aircraft Types**:
  - 🛩️ Cessna (Private Plane) - 300 km/h, Easy handling
  - ✈️ Airliner (Commercial) - 850 km/h, Medium handling  
  - 🛫 Jet (Fighter) - 1500 km/h, Responsive handling
- 🗺️ **100+ International Airports** - Including major hubs worldwide
- 🎥 **Multiple Camera Views** - Third-person, Cockpit, and Overhead views
- 📱 **Responsive Design** - Works on PC and mobile with touch/gyroscope controls
- 🌐 **Bilingual Support** - English and Chinese

### 🎯 Controls

#### PC (Keyboard)

| Key | Action |
|-----|--------|
| W / ↑ | Pitch Down (Dive) |
| S / ↓ | Pitch Up (Climb) |
| A / ← | Roll/Turn Left |
| D / → | Roll/Turn Right |
| Q | Yaw Left |
| E | Yaw Right |
| Shift | Accelerate |
| Ctrl | Decelerate |
| Space | Stabilize Aircraft |
| V | Switch Camera View |
| M | Open Airport Menu |

#### Mobile

- **Virtual Joystick** - Left side of screen for direction control
- **Buttons** - Right side for throttle and stabilization
- **Two-finger tap** - Switch camera view
- **Gyroscope** (optional) - Tilt device to control aircraft

### 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/LongTaiJun/sky-flight.git
cd sky-flight
```

2. Start a local web server:
```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve
```

3. Open your browser and navigate to `http://localhost:8000`

### 🛠️ Technology Stack

- **Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **3D Engine**: Three.js
- **Earth Textures**: NASA Blue Marble + NASA Black Marble (night lights)
- **Airport Data**: OpenFlights Database (JSON format)

### 📍 Development Roadmap

#### Phase 1 ✅ (Current)
- [x] 3D Earth with satellite textures
- [x] Day/night lighting system
- [x] Multiple aircraft types
- [x] Flight controls (keyboard + touch)
- [x] Camera views with smooth transitions
- [x] 100+ international airports
- [x] HUD interface
- [x] Settings menu
- [x] Bilingual support (EN/ZH)
- [x] Mobile responsive design

#### Phase 2 (Planned)
- [ ] Weather system (clouds, rain)
- [ ] Terrain elevation
- [ ] More aircraft models
- [ ] Flight planning routes
- [ ] Achievements system

#### Phase 3 (Future)
- [ ] Multiplayer mode
- [ ] Custom aircraft liveries
- [ ] Real-time flight data integration
- [ ] VR support

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 中文

### 🎮 关于

**天际飞行 (Sky Flight)** 是一款基于 Three.js 开发的网页 3D 飞行模拟器游戏。体验在精美渲染的地球上飞行,感受真实的昼夜变化,探索全球 100 多个国际机场,在 PC 和手机上都能享受流畅的操控体验。

灵感来源于 fly.pieter.com 的简洁操作与微软模拟飞行的真实感。

### ✨ 功能特性

- 🌍 **3D 地球渲染** - 高清卫星纹理配合大气光晕效果
- 🌓 **昼夜系统** - 根据飞机位置实时计算光照,夜间显示城市灯光
- ✈️ **多种飞机类型**:
  - 🛩️ 塞斯纳 (私人飞机) - 300 km/h, 简单操控
  - ✈️ 客机 (商用客机) - 850 km/h, 中等操控
  - 🛫 喷气机 (战斗机) - 1500 km/h, 灵敏操控
- 🗺️ **100+ 国际机场** - 涵盖全球主要航空枢纽
- 🎥 **多视角切换** - 第三人称、驾驶舱、俯瞰视角
- 📱 **响应式设计** - 支持 PC 和移动端,包括触控和陀螺仪控制
- 🌐 **双语支持** - 中文和英文

### 🎯 操控说明

#### PC 端 (键盘)

| 按键 | 功能 |
|------|------|
| W / ↑ | 俯冲 (机头向下) |
| S / ↓ | 拉升 (机头向上) |
| A / ← | 左翻滚/转向 |
| D / → | 右翻滚/转向 |
| Q | 左偏航 |
| E | 右偏航 |
| Shift | 加速 |
| Ctrl | 减速 |
| Space | 稳定飞机 |
| V | 切换视角 |
| M | 打开机场菜单 |

#### 移动端

- **虚拟摇杆** - 屏幕左侧控制方向
- **按钮** - 屏幕右侧控制油门和稳定
- **双指点击** - 切换视角
- **陀螺仪** (可选) - 倾斜设备控制飞机

### 🚀 快速开始

1. 克隆仓库:
```bash
git clone https://github.com/LongTaiJun/sky-flight.git
cd sky-flight
```

2. 启动本地服务器:
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve
```

3. 打开浏览器访问 `http://localhost:8000`

### 🛠️ 技术栈

- **前端框架**: HTML5 + CSS3 + JavaScript (ES6+)
- **3D 引擎**: Three.js
- **地球纹理**: NASA Blue Marble + NASA Black Marble (夜间灯光)
- **机场数据**: OpenFlights 数据库 (JSON 格式)

### 📍 开发路线图

#### 阶段一 ✅ (当前)
- [x] 3D 地球卫星纹理
- [x] 昼夜光照系统
- [x] 多种飞机类型
- [x] 飞行控制 (键盘 + 触控)
- [x] 平滑视角切换
- [x] 100+ 国际机场
- [x] HUD 界面
- [x] 设置菜单
- [x] 中英双语
- [x] 移动端适配

#### 阶段二 (计划中)
- [ ] 天气系统 (云层、降雨)
- [ ] 地形高程
- [ ] 更多飞机模型
- [ ] 航线规划
- [ ] 成就系统

#### 阶段三 (未来)
- [ ] 多人模式
- [ ] 自定义飞机涂装
- [ ] 实时航班数据
- [ ] VR 支持

### 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。