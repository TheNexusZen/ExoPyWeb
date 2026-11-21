// ============================================================================
// Interactive ExoPython / Exoscript Parser, 2D Canvas Preview & .exolvl Builder
// ============================================================================

const PLAYGROUND_PRESETS = {
  basic: `import exopy as exo

lvl = exo.init(
    "Starter Track",
    bg_type="Mountains",
    laps=1,
    gravity=(0.0, -74.0),
    settings={
        "AuthorTime": 10.5,
        "Gold": 13.0,
        "Silver": 17.0,
    },
)

# Main floor, ramp, and elevated platform
exo.CreateObj("terrain", (0, -3)).settings({"Box": (34, 2), "Color": "#334155"}).pack()
exo.CreateObj("terrain", (22, 0)).settings({"Box": (14, 1.5), "Rotation": 22.0, "Color": "#38bdf8"}).pack()
exo.CreateObj("terrain", (40, 3)).settings({"Box": (22, 2), "Color": "#334155"}).pack()

# Start, banner text, and finish
exo.CreateObj("start", (-13, -1)).pack()
exo.CreateObj("text", (18, 7)).settings({"Text": "JUMP!", "FontSize": 3.5}).pack()
exo.CreateObj("finish", (47, 5)).pack()

lvl.export("starter_track.exolvl")`,

  moving: `import exopy as exo
from exopy import scripts as exoscript, variables as exovar

lvl = exo.init("Moving Platform Exoscript", bg_type="Mountains", gravity=(0.0, -74.0))

# Static start & end platforms
exo.CreateObj("terrain", (-16, -2)).settings({"Box": (14, 2), "Color": "#334155"}).pack()
exo.CreateObj("terrain", (24, 2)).settings({"Box": (14, 2), "Color": "#334155"}).pack()

# Store the moving platform and Exoscript in Python variables
platform = exo.CreateObj("terrain", (-4, -2)).settings({"Box": (7, 1.2), "Color": "#38bdf8"}).pack()
trips = exovar.Int("trips", 0)

patrol_block = (
    exoscript.block()
    .move(platform, (12, 2), duration=1.4, wait=True)
    .move(platform, (-4, -2), duration=1.4, wait=True)
    .set_var(trips, trips + 1)
)

mover_script = exoscript.create("MoveLoop").on(0)
mover_script.repeat(10, patrol_block)
mover_script.pack()

exo.CreateObj("start", (-19, 0)).pack()
exo.CreateObj("finish", (27, 4)).pack()

lvl.export("moving_platform.exolvl")`,

  stored: `import exopy as exo
from exopy import scripts as exoscript, variables as exovar

lvl = exo.init(
    "Stored Blocks & Spinners",
    bg_type="Custom",
    gravity=(0.0, -74.0),
    settings={"CustomBackgroundColor": "#0b1120"},
)

exo.CreateObj("terrain", (0, -4)).settings({"Box": (56, 2), "Color": "#1e293b"}).pack()
exo.CreateObj("start", (-23, -2)).pack()
exo.CreateObj("finish", (23, -2)).pack()

# Store objects and reusable Exoscript blocks in Python variables
spinner = exo.CreateObj("terrain", (0, 2)).settings({"Box": (12, 0.8), "Color": "#f43f5e", "Tag": "hazard"}).pack()
pulse_pad = exo.CreateObj("terrain", (13, -2.5)).settings({"Box": (5, 0.8), "Color": "#10b981"}).pack()

@exoscript.func(name="pulse_effect")
def pulse_effect(target: exovar.ObjectSet):
    return (
        exoscript.block()
        .scale(target, (1.35, 1.45), duration=0.75, wait=True)
        .scale(target, (1.0, 1.0), duration=0.75, wait=True)
    )

hazard_script = (
    exoscript.create("SpinAndPulse")
    .on(0)
    .rotate(spinner, 360.0, duration=2.4, wait=True)
    .call(pulse_effect, pulse_pad)
    .pack()
)

exo.CreateObj("text", (0, 9)).settings({"Text": "EXOSCRIPT LIVE", "FontSize": 3.0}).pack()
lvl.export("stored_blocks.exolvl")`,
};

const PlaygroundManager = (() => {
  let currentCode = PLAYGROUND_PRESETS.moving;
  let levelState = null;
  let rafId = null;
  let isPaused = false;
  let animStartTime = performance.now();
  let cam = { x: 4, y: 0, zoom: 14 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0, camX: 0, camY: 0 };

  function parseTuple2(str, fallback = [0, 0]) {
    if (!str) return fallback;
    const m = str.match(/\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
    if (!m) return fallback;
    return [parseFloat(m[1]), parseFloat(m[2])];
  }

  function parseCode(code) {
    const state = {
      name: 'Untitled Level',
      bg_type: 'Mountains',
      customBg: '#0b101b',
      laps: 1,
      gravity: [0.0, -74.0],
      exportFile: 'preview_level.exolvl',
      obfuscate: false,
      layers: [{ id: 1, name: 'Layer 1', parallax: [0, 0] }],
      objects: [],
      variables: [],
      scripts: [],
      animations: [],
    };

    const varToObj = {};
    const varToBlock = {};
    const funcToBlock = {};

    // Parse exo.init(...)
    const initMatch = code.match(/exo\.init\s*\(([\s\S]*?)\)\s*(?:\n|$)/);
    if (initMatch) {
      const body = initMatch[1];
      const nameM = body.match(/^\s*["']([^"']+)["']/);
      if (nameM) state.name = nameM[1];
      const bgM = body.match(/bg_type\s*=\s*["']([^"']+)["']/);
      if (bgM) state.bg_type = bgM[1];
      const lapsM = body.match(/laps\s*=\s*(\d+)/);
      if (lapsM) state.laps = parseInt(lapsM[1], 10);
      const gravM = body.match(/gravity\s*=\s*(\([^)]+\))/);
      if (gravM) state.gravity = parseTuple2(gravM[1], [0.0, -74.0]);
      const cbgM = body.match(/["']CustomBackgroundColor["']\s*:\s*["']([^"']+)["']/);
      if (cbgM) state.customBg = cbgM[1];
    }

    // Parse exo.CreateLayer(...)
    const layerRegex = /(?:([a-zA-Z_]\w*)\s*=\s*)?exo\.CreateLayer\s*\(\s*["']([^"']+)["']([^)]*)\)/g;
    let lm;
    while ((lm = layerRegex.exec(code)) !== null) {
      const pM = lm[3].match(/parallax\s*=\s*(\([^)]+\))/);
      state.layers.push({
        id: state.layers.length + 1,
        name: lm[2],
        parallax: pM ? parseTuple2(pM[1], [0, 0]) : [0, 0],
      });
    }

    // Parse exo.CreateObj(...) chains
    const objRegex = /(?:([a-zA-Z_]\w*)\s*=\s*)?exo\.CreateObj\s*\(\s*["']?([^"',)]+)["']?\s*,\s*(\([^)]+\))\s*\)([\s\S]*?)\.pack\s*\(\s*\)/g;
    let om;
    while ((om = objRegex.exec(code)) !== null) {
      const varName = om[1] || null;
      const type = om[2].toLowerCase();
      const pos = parseTuple2(om[3], [0, 0]);
      const chain = om[4] || '';

      const obj = {
        id: state.objects.length + 1,
        varName,
        type,
        pos: [...pos],
        basePos: [...pos],
        box: type === 'terrain' ? [6, 2] : [1.6, 1.6],
        scale: [1, 1],
        baseScale: [1, 1],
        rotation: 0,
        baseRotation: 0,
        color:
          type === 'start'
            ? '#22c55e'
            : type === 'finish'
            ? '#eab308'
            : type === 'text'
            ? '#f8fafc'
            : '#475569',
        text: '',
        tag: '',
      };

      const boxM = chain.match(/["']Box["']\s*:\s*(\([^)]+\))/);
      if (boxM) obj.box = parseTuple2(boxM[1], obj.box);

      const rotM = chain.match(/["']Rotation["']\s*:\s*([+-]?\d+(?:\.\d+)?)/);
      if (rotM) {
        obj.rotation = parseFloat(rotM[1]);
        obj.baseRotation = obj.rotation;
      }

      const scM = chain.match(/["']Scale["']\s*:\s*(\([^)]+\))/);
      if (scM) {
        obj.scale = parseTuple2(scM[1], [1, 1]);
        obj.baseScale = [...obj.scale];
      }

      const colM = chain.match(/["']Color["']\s*:\s*["']([^"']+)["']/);
      if (colM) obj.color = colM[1];

      const txtM = chain.match(/["']Text["']\s*:\s*["']([^"']+)["']/);
      if (txtM) obj.text = txtM[1];

      const tagM = chain.match(/["']Tag["']\s*:\s*["']([^"']+)["']/);
      if (tagM) obj.tag = tagM[1];

      state.objects.push(obj);
      if (varName) varToObj[varName] = obj;
    }

    // Parse exovar.* declarations
    const varRegex = /([a-zA-Z_]\w*)\s*=\s*exovar\.(Int|Float|Bool|String|Color|Vector|Object|ObjectSet)\s*\(\s*["']([^"']+)["'](?:\s*,\s*([^)]+))?\)/g;
    let vm;
    while ((vm = varRegex.exec(code)) !== null) {
      state.variables.push({
        pyVar: vm[1],
        type: vm[2],
        name: vm[3],
        initial: (vm[4] || '').trim(),
      });
    }

    // Parse stored exoscript.block() variables
    const blockRegex = /([a-zA-Z_]\w*)\s*=\s*\(?\s*exoscript\.block\s*\(\s*\)([\s\S]*?)(?:\n\s*\)|\n\s*\n)/g;
    let bm;
    while ((bm = blockRegex.exec(code)) !== null) {
      varToBlock[bm[1]] = bm[2];
    }

    // Parse @exoscript.func definitions
    const funcRegex = /@exoscript\.func[^\n]*\ndef\s+([a-zA-Z_]\w*)\s*\(\s*([a-zA-Z_]\w*)[^)]*\)\s*:[\s\S]*?return\s*\(?\s*exoscript\.block\s*\(\s*\)([\s\S]*?)(?:\n\s*\)|\n\s*\n)/g;
    let fm;
    while ((fm = funcRegex.exec(code)) !== null) {
      funcToBlock[fm[1]] = { paramName: fm[2], body: fm[3] };
    }

    function extractActions(chainText, scriptName) {
      const moveRe = /\.move\s*\(\s*([a-zA-Z_]\w*)\s*,\s*(\([^)]+\))([^)]*)\)/g;
      let mm;
      while ((mm = moveRe.exec(chainText)) !== null) {
        const targetObj = varToObj[mm[1]];
        const dest = parseTuple2(mm[2], [0, 0]);
        const durM = mm[3].match(/duration\s*=\s*([+-]?\d+(?:\.\d+)?)/);
        if (targetObj) {
          state.animations.push({
            kind: 'move',
            scriptName,
            target: targetObj,
            to: dest,
            duration: durM ? Math.max(0.2, parseFloat(durM[1])) : 1.0,
          });
        }
      }

      const rotRe = /\.rotate\s*\(\s*([a-zA-Z_]\w*)\s*,\s*([+-]?\d+(?:\.\d+)?)([^)]*)\)/g;
      let rm;
      while ((rm = rotRe.exec(chainText)) !== null) {
        const targetObj = varToObj[rm[1]];
        const angle = parseFloat(rm[2]);
        const durM = rm[3].match(/duration\s*=\s*([+-]?\d+(?:\.\d+)?)/);
        if (targetObj) {
          state.animations.push({
            kind: 'rotate',
            scriptName,
            target: targetObj,
            to: angle,
            duration: durM ? Math.max(0.2, parseFloat(durM[1])) : 1.5,
          });
        }
      }

      const scaleRe = /\.scale\s*\(\s*([a-zA-Z_]\w*)\s*,\s*(\([^)]+\))([^)]*)\)/g;
      let sm;
      while ((sm = scaleRe.exec(chainText)) !== null) {
        const targetObj = varToObj[sm[1]];
        const toScale = parseTuple2(sm[2], [1, 1]);
        const durM = sm[3].match(/duration\s*=\s*([+-]?\d+(?:\.\d+)?)/);
        if (targetObj) {
          state.animations.push({
            kind: 'scale',
            scriptName,
            target: targetObj,
            to: toScale,
            duration: durM ? Math.max(0.2, parseFloat(durM[1])) : 1.0,
          });
        }
      }
    }

    // Parse exoscript.create(...) scripts (chained or stored in Python variables)
    const scriptRegex = /(?:([a-zA-Z_]\w*)\s*=\s*)?\(?\s*exoscript\.create\s*\(\s*["']([^"']+)["']\s*\)([\s\S]*?)\.pack\s*\(\s*\)/g;
    let stm;
    while ((stm = scriptRegex.exec(code)) !== null) {
      const pyVar = stm[1] || null;
      const sName = stm[2];
      let body = stm[3] || '';

      // Expand .repeat(N, stored_block_var)
      const repVarRe = /\.repeat\s*\(\s*\d+\s*,\s*([a-zA-Z_]\w*)\s*\)/g;
      let rvm;
      while ((rvm = repVarRe.exec(body)) !== null) {
        if (varToBlock[rvm[1]]) {
          body += '\n' + varToBlock[rvm[1]];
        }
      }

      // Expand .call(func_name, target_obj_var)
      const callRe = /\.call\s*\(\s*([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)/g;
      let cm;
      while ((cm = callRe.exec(body)) !== null) {
        const fnInfo = funcToBlock[cm[1]];
        if (fnInfo) {
          const replaced = fnInfo.body.replace(new RegExp(`\\b${fnInfo.paramName}\\b`, 'g'), cm[2]);
          body += '\n' + replaced;
        }
      }

      state.scripts.push({ name: sName, pyVar });
      extractActions(body, sName);
    }

    // Parse lvl.export(...)
    const expM = code.match(/\.export\s*\(\s*["']([^"']+)["']([^)]*)\)/);
    if (expM) {
      state.exportFile = expM[1];
      if (/obfuscate\s*=\s*True/.test(expM[2])) state.obfuscate = true;
    }

    return state;
  }

  function autoFitCamera() {
    if (!levelState || levelState.objects.length === 0) {
      cam = { x: 0, y: 0, zoom: 14 };
      return;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    levelState.objects.forEach((o) => {
      const hw = (o.box[0] * o.baseScale[0]) / 2;
      const hh = (o.box[1] * o.baseScale[1]) / 2;
      minX = Math.min(minX, o.basePos[0] - hw);
      maxX = Math.max(maxX, o.basePos[0] + hw);
      minY = Math.min(minY, o.basePos[1] - hh);
      maxY = Math.max(maxY, o.basePos[1] + hh);
    });

    cam.x = (minX + maxX) / 2;
    cam.y = (minY + maxY) / 2;

    const canvas = document.getElementById('playground-canvas');
    if (canvas && canvas.clientWidth && canvas.clientHeight) {
      const spanX = Math.max(16, maxX - minX + 12);
      const spanY = Math.max(10, maxY - minY + 10);
      cam.zoom = Math.max(6, Math.min(36, Math.min(canvas.clientWidth / spanX, canvas.clientHeight / spanY)));
    }
  }

  function renderFrame(now) {
    const canvas = document.getElementById('playground-canvas');
    if (!canvas || !levelState) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
    }

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    const w = rect.width || 600;
    const h = rect.height || 340;

    const themeBg = {
      Mountains: '#0f172a',
      Halloween: '#181024',
      Christmas: '#0c1d2c',
      Custom: levelState.customBg || '#090d16',
    };
    ctx.fillStyle = themeBg[levelState.bg_type] || '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Reset transforms before applying active Exoscript animations
    levelState.objects.forEach((o) => {
      o.pos = [...o.basePos];
      o.rotation = o.baseRotation;
      o.scale = [...o.baseScale];
    });

    const elapsed = isPaused ? 0 : (now - animStartTime) / 1000;
    levelState.animations.forEach((anim) => {
      const cycle = anim.duration * 2;
      const phase = (elapsed % cycle) / anim.duration;
      const t = phase <= 1 ? phase : 2 - phase;
      const ease = t * t * (3 - 2 * t);

      if (anim.kind === 'move') {
        anim.target.pos[0] = anim.target.basePos[0] + (anim.to[0] - anim.target.basePos[0]) * ease;
        anim.target.pos[1] = anim.target.basePos[1] + (anim.to[1] - anim.target.basePos[1]) * ease;
      } else if (anim.kind === 'rotate') {
        anim.target.rotation = anim.target.baseRotation + anim.to * ((elapsed / anim.duration) % 1);
      } else if (anim.kind === 'scale') {
        anim.target.scale[0] = anim.target.baseScale[0] + (anim.to[0] - anim.target.baseScale[0]) * ease;
        anim.target.scale[1] = anim.target.baseScale[1] + (anim.to[1] - anim.target.baseScale[1]) * ease;
      }
    });

    const toScreenX = (wx) => w / 2 + (wx - cam.x) * cam.zoom;
    const toScreenY = (wy) => h / 2 - (wy - cam.y) * cam.zoom;

    // Coordinate grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    const step = 5;
    const leftWorld = cam.x - w / (2 * cam.zoom);
    const rightWorld = cam.x + w / (2 * cam.zoom);
    const bottomWorld = cam.y - h / (2 * cam.zoom);
    const topWorld = cam.y + h / (2 * cam.zoom);

    for (let gx = Math.floor(leftWorld / step) * step; gx <= rightWorld; gx += step) {
      const sx = toScreenX(gx);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gy = Math.floor(bottomWorld / step) * step; gy <= topWorld; gy += step) {
      const sy = toScreenY(gy);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Origin axes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.moveTo(toScreenX(0), 0);
    ctx.lineTo(toScreenX(0), h);
    ctx.moveTo(0, toScreenY(0));
    ctx.lineTo(w, toScreenY(0));
    ctx.stroke();

    // Render level objects
    levelState.objects.forEach((o) => {
      const sx = toScreenX(o.pos[0]);
      const sy = toScreenY(o.pos[1]);
      const pw = o.box[0] * o.scale[0] * cam.zoom;
      const ph = o.box[1] * o.scale[1] * cam.zoom;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((-o.rotation * Math.PI) / 180);

      if (o.type === 'text') {
        ctx.fillStyle = o.color || '#f8fafc';
        ctx.font = `600 ${Math.max(11, Math.round(cam.zoom * 0.9))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.text || 'Text', 0, 0);
      } else if (o.type === 'start' || o.type === 'finish') {
        ctx.fillStyle = o.type === 'start' ? 'rgba(34, 197, 94, 0.22)' : 'rgba(234, 179, 8, 0.22)';
        ctx.strokeStyle = o.type === 'start' ? '#22c55e' : '#eab308';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = o.type === 'start' ? '#86efac' : '#fde047';
        ctx.font = '700 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.type.toUpperCase(), 0, 0);
      } else {
        ctx.fillStyle = o.color || '#475569';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 4);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    });

    // HUD Overlay
    ctx.fillStyle = 'rgba(9, 9, 11, 0.68)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 238, 44, 8);
    ctx.fill();

    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText(levelState.name, 22, 30);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`${levelState.bg_type} • g=(${levelState.gravity[0]}, ${levelState.gravity[1]})`, 22, 46);

    ctx.restore();
    rafId = requestAnimationFrame(renderFrame);
  }

  function updateInspector() {
    if (!levelState) return;
    const summaryEl = document.getElementById('pg-inspector-summary');
    const jsonEl = document.getElementById('pg-inspector-json');
    if (!summaryEl || !jsonEl) return;

    const stats = [
      { label: 'Objects', val: levelState.objects.length },
      { label: 'Exoscripts', val: levelState.scripts.length },
      { label: 'Variables', val: levelState.variables.length },
      { label: 'Theme', val: levelState.bg_type },
    ];

    summaryEl.innerHTML = stats
      .map(
        (s) => `
        <div class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-3">
          <div class="text-[11px] text-zinc-500 dark:text-zinc-400">${s.label}</div>
          <div class="mt-0.5 font-mono text-base font-semibold text-zinc-900 dark:text-white">${escapeHtml(String(s.val))}</div>
        </div>
      `
      )
      .join('');

    const manifest = {
      level_name: levelState.name,
      bg_type: levelState.bg_type,
      laps: levelState.laps,
      gravity: levelState.gravity,
      export_target: levelState.exportFile,
      obfuscated: levelState.obfuscate,
      layers: levelState.layers,
      objects: levelState.objects.map((o) => ({
        id: o.id,
        type: o.type,
        pos: o.basePos,
        box: o.box,
        rotation: o.baseRotation,
        tag: o.tag || undefined,
        text: o.text || undefined,
      })),
      exoscripts: levelState.scripts,
      exovar_variables: levelState.variables,
    };
    jsonEl.textContent = JSON.stringify(manifest, null, 2);
  }

  function run() {
    const editor = document.getElementById('playground-editor');
    const statusText = document.getElementById('pg-status-text');
    const animBadge = document.getElementById('pg-anim-badge');
    if (!editor) return;

    currentCode = editor.value;
    levelState = parseCode(currentCode);
    animStartTime = performance.now();
    autoFitCamera();
    updateInspector();

    if (statusText) {
      statusText.textContent = `Built "${levelState.name}" — ${levelState.objects.length} objects, ${levelState.scripts.length} Exoscripts, ${levelState.variables.length} variables.`;
    }
    if (animBadge) {
      animBadge.classList.toggle('hidden', levelState.animations.length === 0);
    }
  }

  function downloadFile(filename, data, mime = 'application/octet-stream') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Build a real NYA^ v18 binary .exolvl file (and gzip-compress via CompressionStream if supported)
  async function buildBinaryExolvl(state) {
    const chunks = [];
    const pushBytes = (arr) => chunks.push(new Uint8Array(arr));
    const pushI32 = (v) => {
      const b = new ArrayBuffer(4);
      new DataView(b).setInt32(0, v | 0, true);
      chunks.push(new Uint8Array(b));
    };
    const pushI64 = (v) => {
      const b = new ArrayBuffer(8);
      new DataView(b).setBigInt64(0, BigInt(Math.round(v)), true);
      chunks.push(new Uint8Array(b));
    };
    const pushF32 = (v) => {
      const b = new ArrayBuffer(4);
      new DataView(b).setFloat32(0, Number(v), true);
      chunks.push(new Uint8Array(b));
    };
    const pushBool = (v) => pushBytes([v ? 1 : 0]);
    const pushVec2 = (xy) => {
      pushF32(xy[0]);
      pushF32(xy[1]);
    };
    const pushVarint = (val) => {
      let v = val >>> 0;
      while (v >= 0x80) {
        pushBytes([(v & 0x7f) | 0x80]);
        v >>>= 7;
      }
      pushBytes([v]);
    };
    const pushStr = (s) => {
      const enc = new TextEncoder().encode(String(s));
      pushVarint(enc.length);
      chunks.push(enc);
    };
    const hexToRgba = (hex) => {
      const clean = String(hex || '#475569').replace('#', '');
      const num = parseInt(clean.padEnd(6, '0').slice(0, 6), 16) || 0x475569;
      return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255, 1.0];
    };
    const pushColor = (hex) => {
      const rgba = hexToRgba(hex);
      rgba.forEach(pushF32);
    };

    const levelUuid = crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000001';
    const tileMap = { terrain: 1, start: 2, finish: 3, text: 4 };
    const themeMap = {
      Mountains: 'Mountains',
      Halloween: 'Halloween',
      Christmas: 'Christmas',
      Custom: 'Custom',
    };

    // Header: NYA^ + version 18
    pushBytes([0x4e, 0x59, 0x41, 0x5e]);
    pushI32(18);
    pushStr(levelUuid);
    pushI32(1);
    pushStr(state.name);
    pushStr('');
    pushI64(0);
    pushI64(0);
    pushI64(0);
    pushI32(0);
    pushI64(0);
    pushI64(0);
    pushI32(state.laps);
    pushBool(false);
    pushBool(true);
    pushStr(levelUuid);
    pushI32(1);
    pushBool(true);
    for (let i = 0; i < 6; i++) pushI32(0);

    // Objects
    pushI32(state.objects.length);
    state.objects.forEach((o) => {
      pushI32(o.id);
      pushI32(tileMap[o.type] || 1);
      pushI32(0);
      pushI32(0);
      pushVec2(o.basePos);
      pushVec2(o.baseScale);
      pushF32(o.baseRotation);
      pushStr(o.tag || '');

      const props = [];
      if (o.type === 'terrain') {
        props.push({ id: 1, kind: 'tcorners', box: o.box });
      }
      if (o.type === 'text' && o.text) {
        props.push({ id: 2, kind: 'str', val: o.text });
      }
      pushI32(props.length);
      props.forEach((p) => {
        pushI32(p.id);
        if (p.kind === 'tcorners') {
          const hw = p.box[0] / 2;
          const hh = p.box[1] / 2;
          pushI32(1);
          pushI32(4);
          pushVec2([-hw, -hh]);
          pushVec2([hw, -hh]);
          pushVec2([hw, hh]);
          pushVec2([-hw, hh]);
        } else if (p.kind === 'str') {
          pushStr(p.val);
        }
      });

      pushI32(1);
      pushI32(0);
      pushI32(0);
    });

    // Layers
    pushI32(state.layers.length);
    state.layers.forEach((l, idx) => {
      pushI32(l.id || idx + 1);
      pushStr(l.name);
      pushBool(false);
      pushBool(false);
      pushBool(false);
      pushI32(0);
      pushVec2(l.parallax || [0, 0]);
      pushBool(false);
      if (idx === 0) {
        pushI32(state.objects.length);
        state.objects.forEach((o) => pushI32(o.id));
      } else {
        pushI32(0);
      }
    });

    for (let i = 0; i < 4; i++) pushI32(0);
    pushI64(0);
    pushI32(0);
    pushI64(0);
    pushI64(0);
    pushI32(state.laps);
    pushBool(false);
    pushI32(0);
    pushI32(0); // nova_scripts count
    pushI32(0); // global_variables count
    pushStr(themeMap[state.bg_type] || 'Mountains');
    pushColor(state.customBg);
    pushBytes([0, 0, 0, 0]);
    pushI32(0);
    pushVec2([0, 0]);
    pushVec2([0, 0]);
    pushColor('#000000');
    pushColor('#000000');
    pushI32(0);
    pushColor('#000000');
    pushF32(0);
    pushF32(0);
    pushBool(false);
    pushBool(false);
    pushF32(0);
    pushBool(true);
    pushI32(0);
    pushBool(true);
    pushBool(false);
    pushBool(false);
    pushBool(false);
    pushVec2(state.gravity);
    pushI32(0);

    // Exopy footer
    const wm = new TextEncoder().encode('made with exopy');
    const body = new Uint8Array(6 + wm.length);
    body.set([0x45, 0x58, 0x50, 0x59, 0x01, wm.length], 0);
    body.set(wm, 6);
    pushBytes(body);
    const lenBuf = new ArrayBuffer(2);
    new DataView(lenBuf).setUint16(0, body.length, true);
    pushBytes(new Uint8Array(lenBuf));
    pushBytes([0x59, 0x50, 0x58, 0x45]);

    const rawBlob = new Blob(chunks);
    if (typeof CompressionStream !== 'undefined') {
      const cs = new CompressionStream('gzip');
      const compressedStream = rawBlob.stream().pipeThrough(cs);
      return await new Response(compressedStream).blob();
    }
    return rawBlob;
  }

  function mount() {
    const editor = document.getElementById('playground-editor');
    const canvas = document.getElementById('playground-canvas');
    if (!editor || !canvas) return;

    editor.value = currentCode;
    run();

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        if (PLAYGROUND_PRESETS[key]) {
          currentCode = PLAYGROUND_PRESETS[key];
          editor.value = currentCode;
          run();
        }
      });
    });

    // Run button
    const runBtn = document.getElementById('pg-run-btn');
    if (runBtn) runBtn.addEventListener('click', run);

    // Copy code button
    const copyBtn = document.getElementById('pg-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyTextWithFeedback(editor.value, copyBtn);
      });
    }

    // View switches
    const tabCanvas = document.getElementById('pg-tab-canvas');
    const tabInspector = document.getElementById('pg-tab-inspector');
    const viewCanvas = document.getElementById('pg-view-canvas');
    const viewInspector = document.getElementById('pg-view-inspector');

    if (tabCanvas && tabInspector) {
      tabCanvas.addEventListener('click', () => {
        viewCanvas.classList.remove('hidden');
        viewInspector.classList.add('hidden');
        tabCanvas.className = 'rounded-lg bg-sky-500/15 border border-sky-500/40 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 transition-colors';
        tabInspector.className = 'rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors';
      });
      tabInspector.addEventListener('click', () => {
        viewCanvas.classList.add('hidden');
        viewInspector.classList.remove('hidden');
        tabInspector.className = 'rounded-lg bg-sky-500/15 border border-sky-500/40 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 transition-colors';
        tabCanvas.className = 'rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors';
      });
    }

    // Play / Pause & Reset Camera
    const playToggle = document.getElementById('pg-play-toggle');
    if (playToggle) {
      playToggle.addEventListener('click', () => {
        isPaused = !isPaused;
        playToggle.textContent = isPaused ? 'Resume Anim' : 'Pause Anim';
      });
    }

    const resetCamBtn = document.getElementById('pg-reset-cam');
    if (resetCamBtn) resetCamBtn.addEventListener('click', autoFitCamera);

    // Export .py & .exolvl
    const exportPyBtn = document.getElementById('pg-export-py');
    if (exportPyBtn) {
      exportPyBtn.addEventListener('click', () => {
        downloadFile('my_exoscript_level.py', editor.value, 'text/x-python');
      });
    }

    const exportExolvlBtn = document.getElementById('pg-export-exolvl');
    if (exportExolvlBtn) {
      exportExolvlBtn.addEventListener('click', async () => {
        run();
        const blob = await buildBinaryExolvl(levelState);
        downloadFile(levelState.exportFile || 'preview_level.exolvl', blob);
      });
    }

    // Canvas Mouse & Touch Pan/Zoom
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStart = { x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      cam.x = dragStart.camX - (e.clientX - dragStart.x) / cam.zoom;
      cam.y = dragStart.camY + (e.clientY - dragStart.y) / cam.zoom;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, camX: cam.x, camY: cam.y };
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      cam.x = dragStart.camX - (e.touches[0].clientX - dragStart.x) / cam.zoom;
      cam.y = dragStart.camY + (e.touches[0].clientY - dragStart.y) / cam.zoom;
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      isDragging = false;
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        cam.zoom = Math.max(4, Math.min(60, cam.zoom * factor));
      },
      { passive: false }
    );

    unmount();
    rafId = requestAnimationFrame(renderFrame);
  }

  function unmount() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return { mount, unmount };
})();
