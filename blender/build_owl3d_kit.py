"""
HAL · Owl3D model kit, built in Blender.

    blender -b --factory-startup -P blender/build_owl3d_kit.py -- [--preview DIR]

Builds every part the Owl3D portal uses, exports each to
public/owl3d/models/<name>.glb and saves blender/owl3d_kit.blend (one
collection per part) so the shapes can be opened, sculpted and re-exported
by hand. The portal hot-reloads the .glb files.

Conventions (see docs/owl3d.md):
  * Blender is Z-up; glTF export turns it Y-up, and Blender -Y becomes the
    portal's +Z, which faces the viewer. The eye's lens faces -Y.
  * Materials named HAL_State* glow in the agent's state color, HAL_Tool* in
    the color of the tool being used.
  * Empties named socket_* mark attachment points read by the portal.
  * Animation clips are actions pushed to NLA tracks; their names are what
    the manifest's "clips" map refers to.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, "public", "owl3d", "models")
BLEND = os.path.join(HERE, "owl3d_kit.blend")
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
PREVIEW = ARGS[ARGS.index("--preview") + 1] if "--preview" in ARGS else None

# Shared with src/owl3d (bot.ts, rig.ts); change both together.
SHELL_RADIUS = 0.9
LENS_RADIUS = 0.62
UPPER_ARM = 0.9
FOREARM = 0.8

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
scene = bpy.context.scene
scene.render.fps = 24


# ----------------------------------------------------------------- materials

_materials = {}


def material(name, color=(0.05, 0.05, 0.06), metallic=0.0, roughness=0.5, emission=None, strength=1.0):
    if name in _materials:
        return _materials[name]
    mat = bpy.data.materials.new(name)
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    _materials[name] = mat
    return mat


GUNMETAL = lambda: material("Gunmetal", (0.045, 0.05, 0.06), 0.9, 0.32)
CHROME = lambda: material("Chrome", (0.8, 0.82, 0.86), 1.0, 0.12)
DARK = lambda: material("Carbon", (0.012, 0.013, 0.016), 0.2, 0.55)
RUBBER = lambda: material("Rubber", (0.02, 0.02, 0.022), 0.0, 0.85)
GLASS = lambda: material("Glass", (0.02, 0.03, 0.04), 0.0, 0.05)
PANEL = lambda: material("SolarPanel", (0.03, 0.08, 0.2), 0.6, 0.25)
STATE = lambda suffix: material(f"HAL_State_{suffix}", (0.02, 0.02, 0.02), 0.0, 0.4, (1, 1, 1), 1.0)
TOOL = lambda suffix: material(f"HAL_Tool_{suffix}", (0.02, 0.02, 0.02), 0.0, 0.4, (1, 1, 1), 1.0)


# -------------------------------------------------------------------- helpers

def active(obj):
    for other in bpy.context.selected_objects:
        other.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


def finish(obj, name, mat=None, smooth=True, parent=None):
    obj.name = name
    if obj.data is not None:
        obj.data.name = name
        if mat is not None:
            obj.data.materials.clear()
            obj.data.materials.append(mat)
        if smooth and hasattr(obj.data, "polygons"):
            for poly in obj.data.polygons:
                poly.use_smooth = True
    if parent is not None:
        obj.parent = parent
    return obj


def add(kind, name, mat=None, parent=None, smooth=True, **kw):
    getattr(bpy.ops.mesh, f"primitive_{kind}_add")(**kw)
    return finish(bpy.context.object, name, mat, smooth, parent)


def bevel(obj, width=0.02, segments=3):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL").keep_sharp = True
    return obj


def subsurf(obj, levels=2):
    mod = obj.modifiers.new("Subsurf", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    return obj


def sculpt(obj, strength=0.01, scale=0.35, kind="CLOUDS"):
    """Procedural sculpt: displace along normals with a noise texture."""
    tex = bpy.data.textures.new(f"{obj.name}_sculpt", kind)
    if hasattr(tex, "noise_scale"):
        tex.noise_scale = scale
    mod = obj.modifiers.new("Sculpt", "DISPLACE")
    mod.texture = tex
    mod.strength = strength
    mod.mid_level = 0.5
    return obj


def apply_all(obj):
    active(obj)
    for mod in list(obj.modifiers):
        with bpy.context.temp_override(object=obj, active_object=obj):
            bpy.ops.object.modifier_apply(modifier=mod.name)


def cut(obj, cutter):
    """Boolean difference, applied immediately; the cutter is removed."""
    mod = obj.modifiers.new("Cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    active(obj)
    with bpy.context.temp_override(object=obj, active_object=obj):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def empty(name, location, parent):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size = 0.1
    obj.location = location
    obj.parent = parent
    bpy.context.collection.objects.link(obj)
    return obj


def root(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj


def clip(obj, name, path, keys, index=-1):
    """Keyframe `path` on `obj` as action `name` and park it on an NLA track."""
    obj.animation_data_create()
    action = bpy.data.actions.new(name)
    action["clip"] = name  # Blender may suffix the name; export restores it
    action.use_fake_user = True
    obj.animation_data.action = action
    for frame, value in keys:
        setattr(obj, path, value)
        obj.keyframe_insert(path, index=index, frame=frame)
    track = obj.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(keys[0][0]), action)
    obj.animation_data.action = None
    setattr(obj, path, keys[0][1])


def new_collection(name):
    coll = bpy.data.collections.new(name)
    scene.collection.children.link(coll)
    layer = bpy.context.view_layer.layer_collection.children[name]
    bpy.context.view_layer.active_layer_collection = layer
    return coll


# --------------------------------------------------------------------- parts

def build_shell():
    """The HAL sphere: hammered gunmetal, lens opening facing -Y, arm ports."""
    top = root("HAL_Shell")
    body = add("uv_sphere", "Shell", GUNMETAL(), top, segments=96, ring_count=48, radius=SHELL_RADIUS)
    opening = add("cylinder", "cutter", None, None, radius=LENS_RADIUS, depth=2, location=(0, -1.3, 0), rotation=(math.pi / 2, 0, 0), vertices=96)
    cut(body, opening)
    # Panel seams: three shallow meridian grooves and a belt groove.
    for angle in (0, math.pi / 3, -math.pi / 3):
        groove = add("torus", "cutter", None, None, major_radius=SHELL_RADIUS + 0.02, minor_radius=0.022, major_segments=128, minor_segments=8, rotation=(0, math.pi / 2, angle + math.pi / 2))
        cut(body, groove)
    # Arm ports and the cable port underneath.
    for side in (-1, 1):
        port = add("cylinder", "cutter", None, None, radius=0.17, depth=0.3, location=(side * SHELL_RADIUS, 0.05, -0.15), rotation=(0, math.pi / 2, 0), vertices=48)
        cut(body, port)
        ring = add("torus", f"PortRing{'L' if side < 0 else 'R'}", STATE("Port"), top, major_radius=0.15, minor_radius=0.02, location=(side * (SHELL_RADIUS - 0.08), 0.05, -0.15), rotation=(0, math.pi / 2, 0))
        empty(f"socket_arm_{'L' if side < 0 else 'R'}", (side * (SHELL_RADIUS - 0.1), 0.05, -0.15), top)
    cable = add("cylinder", "cutter", None, None, radius=0.13, depth=0.3, location=(0, 0.1, -SHELL_RADIUS))
    cut(body, cable)
    add("torus", "CablePortRing", STATE("Port"), top, major_radius=0.12, minor_radius=0.018, location=(0, 0.1, -SHELL_RADIUS + 0.06))
    empty("socket_cable", (0, 0.1, -SHELL_RADIUS + 0.04), top)
    empty("socket_top", (0, 0, SHELL_RADIUS), top)
    # Vents on the crown.
    for i in range(5):
        vent = add("cube", "cutter", None, None, size=1, location=(0, 0.25 + i * 0.09, 0.86), scale=(0.34, 0.03, 0.2))
        cut(body, vent)
    sculpt(body, 0.004, 0.08)
    body.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    # Lens bezel and a glowing belt, both trimmed to the opening.
    rim_y = -math.sqrt(SHELL_RADIUS**2 - LENS_RADIUS**2)
    add("torus", "Bezel", CHROME(), top, major_radius=LENS_RADIUS + 0.025, minor_radius=0.045, major_segments=128, minor_segments=24, location=(0, rim_y, 0), rotation=(math.pi / 2, 0, 0))
    belt = add("torus", "Belt", STATE("Belt"), top, major_radius=SHELL_RADIUS - 0.004, minor_radius=0.011, major_segments=192, minor_segments=8, location=(0, 0, -0.22))
    belt.scale = (math.cos(math.asin(0.22 / SHELL_RADIUS)),) * 2 + (1,)
    trim = add("cylinder", "cutter", None, None, radius=LENS_RADIUS + 0.1, depth=2, location=(0, -1.3, 0), rotation=(math.pi / 2, 0, 0))
    cut(belt, trim)
    return top


def arm_segment(name, length, radius):
    """A sculpted hydraulic arm segment along +Z with knuckles at both ends."""
    top = root(name)
    beam = add("cube", "Beam", GUNMETAL(), top, size=1, location=(0, 0, length / 2), scale=(radius * 1.6, radius * 1.1, length * 0.82))
    bevel(beam, 0.025, 3)
    beam.modifiers.new("Taper", "SIMPLE_DEFORM").deform_method = "TAPER"
    beam.modifiers["Taper"].factor = -0.35
    sculpt(beam, 0.006, 0.2)
    for z, r in ((0, radius * 1.05), (length, radius * 0.9)):
        knuckle = add("cylinder", "Knuckle", CHROME(), top, radius=r, depth=radius * 1.9, location=(0, 0, z), rotation=(0, math.pi / 2, 0), vertices=32)
        bevel(knuckle, 0.012, 2)
        add("torus", "KnuckleGlow", STATE("Joint"), top, major_radius=r * 0.65, minor_radius=0.01, location=(radius * 0.96, 0, z), rotation=(0, math.pi / 2, 0))
    piston = add("cylinder", "Piston", CHROME(), top, radius=radius * 0.28, depth=length * 0.7, location=(0, -radius * 0.75, length / 2), vertices=16)
    bevel(piston, 0.005, 1)
    add("cylinder", "PistonSleeve", DARK(), top, radius=radius * 0.36, depth=length * 0.32, location=(0, -radius * 0.75, length * 0.3), vertices=16)
    stripe = add("cube", "Stripe", STATE("Arm"), top, size=1, location=(0, radius * 0.56, length / 2), scale=(radius * 0.25, 0.01, length * 0.6))
    return top


def build_shoulder():
    top = root("ArmShoulder")
    hub = add("cylinder", "Hub", GUNMETAL(), top, radius=0.16, depth=0.18, rotation=(0, math.pi / 2, 0), vertices=48)
    bevel(hub, 0.02, 3)
    add("torus", "HubGlow", STATE("Joint"), top, major_radius=0.12, minor_radius=0.012, location=(0.09, 0, 0), rotation=(0, math.pi / 2, 0))
    yoke = add("cube", "Yoke", DARK(), top, size=1, location=(0, 0, 0.12), scale=(0.12, 0.2, 0.16))
    bevel(yoke, 0.03, 3)
    return top


def tool(name, builder):
    top = root(name)
    collar = add("cylinder", "Collar", CHROME(), top, radius=0.075, depth=0.08, location=(0, 0, 0.04), vertices=32)
    bevel(collar, 0.01, 2)
    builder(top)
    return top


def gripper(top):
    for side in (-1, 1):
        finger = add("cube", "Finger", GUNMETAL(), top, size=1, location=(side * 0.06, 0, 0.2), scale=(0.025, 0.06, 0.24))
        bevel(finger, 0.01, 2)
        finger.modifiers.new("Bend", "SIMPLE_DEFORM").deform_method = "BEND"
        finger.modifiers["Bend"].angle = side * -0.6
        finger.modifiers["Bend"].deform_axis = "Y"
        add("uv_sphere", "Pad", TOOL("Grip"), top, radius=0.022, location=(side * 0.045, 0, 0.31))


def driver(top):
    add("cylinder", "Shaft", CHROME(), top, radius=0.022, depth=0.24, location=(0, 0, 0.2), vertices=6, smooth=False)
    add("cone", "Bit", TOOL("Bit"), top, radius1=0.022, radius2=0.0, depth=0.07, location=(0, 0, 0.355), vertices=6, smooth=False)
    add("torus", "Chuck", DARK(), top, major_radius=0.04, minor_radius=0.015, location=(0, 0, 0.1))


def pen(top):
    body = add("cylinder", "Stylus", GUNMETAL(), top, radius=0.03, depth=0.22, location=(0, 0, 0.19), vertices=24)
    body.modifiers.new("Taper", "SIMPLE_DEFORM").deform_method = "TAPER"
    body.modifiers["Taper"].factor = -0.5
    add("cone", "Nib", TOOL("Nib"), top, radius1=0.018, radius2=0.002, depth=0.07, location=(0, 0, 0.33), vertices=24)


def probe(top):
    add("cylinder", "Stem", GUNMETAL(), top, radius=0.03, depth=0.14, location=(0, 0, 0.14), vertices=24)
    add("torus", "LensRing", CHROME(), top, major_radius=0.07, minor_radius=0.014, location=(0, 0, 0.24), rotation=(math.pi / 2, 0, 0))
    add("cylinder", "Lens", TOOL("Lens"), top, radius=0.062, depth=0.01, location=(0, 0, 0.24), rotation=(math.pi / 2, 0, 0), vertices=32)


def dish(top):
    add("cylinder", "Mast", GUNMETAL(), top, radius=0.018, depth=0.14, location=(0, 0, 0.14), vertices=16)
    bowl = add("uv_sphere", "Dish", CHROME(), top, radius=0.13, location=(0, 0, 0.32), segments=32, ring_count=16)
    cutter = add("cube", "cutter", None, None, size=1, location=(0, 0, 0.32 + 0.6 - 0.04), scale=(1, 1, 1.2))
    cut(bowl, cutter)
    bowl.modifiers.new("Solidify", "SOLIDIFY").thickness = 0.008
    add("uv_sphere", "Feed", TOOL("Feed"), top, radius=0.02, location=(0, 0, 0.36))


def splitter(top):
    for i in range(3):
        a = i * 2 * math.pi / 3
        prong = add("cone", "Prong", GUNMETAL(), top, radius1=0.02, radius2=0.004, depth=0.24, location=(math.cos(a) * 0.05, math.sin(a) * 0.05, 0.22), rotation=(math.sin(a) * 0.35, -math.cos(a) * 0.35, 0), vertices=12)
        add("uv_sphere", "Spark", TOOL("Prong"), top, radius=0.015, location=(math.cos(a) * 0.09, math.sin(a) * 0.09, 0.33))


def build_desk():
    """The cyberdesk: a sculpted slab on angular pedestals, lit inlays, keys."""
    top = root("CyberDesk")
    slab = add("cube", "Top", GUNMETAL(), top, size=1, location=(0, 0, 0.84), scale=(6, 2.4, 0.12))
    bevel(slab, 0.05, 4)
    inset = add("cube", "cutter", None, None, size=1, location=(0, 0.25, 0.92), scale=(5.4, 1.5, 0.06))
    cut(slab, inset)
    add("cube", "WorkSurface", GLASS(), top, size=1, location=(0, 0.25, 0.875), scale=(5.4, 1.5, 0.02))
    for x in (-2.7, 2.7):
        leg = add("cube", "Pedestal", DARK(), top, size=1, location=(x, 0.1, 0.4), scale=(0.5, 1.8, 0.8))
        leg.modifiers.new("Taper", "SIMPLE_DEFORM").deform_method = "TAPER"
        leg.modifiers["Taper"].factor = 0.4
        leg.modifiers["Taper"].deform_axis = "Z"
        bevel(leg, 0.04, 3)
        sculpt(leg, 0.02, 0.3)
        add("cube", "PedestalGlow", STATE("Desk"), top, size=1, location=(x, -0.81, 0.45), scale=(0.08, 0.01, 0.6))
    add("cube", "FrontStrip", STATE("Desk"), top, size=1, location=(0, -1.205, 0.84), scale=(5.6, 0.01, 0.025))
    # Keyboard greebles along the front.
    for row in range(2):
        for col in range(18):
            key = add("cube", "Key", DARK(), top, size=1, location=(-1.7 + col * 0.2, -0.8 + row * 0.18, 0.92), scale=(0.16, 0.14, 0.035))
            bevel(key, 0.012, 2)
    # Holo emitter bar at the back, and cable conduits dropping to the floor.
    emitter = add("cube", "Emitter", CHROME(), top, size=1, location=(0, 1.05, 0.96), scale=(3.2, 0.14, 0.1))
    bevel(emitter, 0.03, 3)
    add("cube", "EmitterGlow", STATE("Holo"), top, size=1, location=(0, 0.98, 1.0), scale=(3.0, 0.01, 0.02))
    for x in (-1.2, 0, 1.2):
        bpy.ops.curve.primitive_bezier_curve_add(location=(0, 0, 0))
        curve = bpy.context.object
        spline = curve.data.splines[0]
        spline.bezier_points[0].co = (x, 1.15, 0.8)
        spline.bezier_points[0].handle_left = (x, 1.15, 0.9)
        spline.bezier_points[0].handle_right = (x, 1.3, 0.5)
        spline.bezier_points[1].co = (x * 1.3, 1.6, 0.0)
        spline.bezier_points[1].handle_left = (x * 1.3, 1.4, 0.1)
        spline.bezier_points[1].handle_right = (x * 1.3, 1.8, 0.0)
        curve.data.bevel_depth = 0.035
        curve.data.bevel_resolution = 4
        finish(curve, "Conduit", RUBBER(), parent=top)
        bpy.ops.object.convert(target="MESH")
    empty("socket_top", (0, 0.25, 0.9), top)
    empty("socket_screen", (0, 1.05, 1.05), top)
    return top


def build_floor_panel():
    """One hatch door: 1 × 2 units, hinged along its local X = 0 edge."""
    top = root("FloorPanel")
    door = add("cube", "Door", DARK(), top, size=1, location=(0.5, 0, -0.04), scale=(0.98, 1.98, 0.08))
    bevel(door, 0.015, 2)
    add("cube", "Edge", STATE("Hatch"), top, size=1, location=(0.97, 0, -0.005), scale=(0.02, 1.9, 0.01))
    for i in range(6):
        rib = add("cube", "Rib", GUNMETAL(), top, size=1, location=(0.5, -0.8 + i * 0.32, -0.11), scale=(0.85, 0.06, 0.06))
        bevel(rib, 0.01, 1)
    hinge = add("cylinder", "Hinge", CHROME(), top, radius=0.04, depth=1.9, location=(0, 0, -0.04), rotation=(math.pi / 2, 0, 0), vertices=16)
    return top


def build_core():
    """The inner computer under the grid: rotor stack inside a rack ring."""
    top = root("InnerCore")
    base = add("cylinder", "Base", DARK(), top, radius=1.7, depth=0.3, location=(0, 0, 0.15), vertices=8, smooth=False)
    bevel(base, 0.05, 2)
    rotor = root("Rotor")
    rotor.parent = top
    for i in range(5):
        z = 0.5 + i * 0.42
        ring = add("torus", "RotorRing", GUNMETAL(), rotor, major_radius=0.75 - i * 0.06, minor_radius=0.09, location=(0, 0, z), major_segments=48)
        sculpt(ring, 0.01, 0.15)
        for k in range(6):
            a = k * math.pi / 3 + i * 0.4
            add("cube", "Slot", STATE("Core"), rotor, size=1, location=(math.cos(a) * (0.75 - i * 0.06), math.sin(a) * (0.75 - i * 0.06), z), scale=(0.06, 0.06, 0.2))
    add("cylinder", "Spine", STATE("Core"), rotor, radius=0.16, depth=2.4, location=(0, 0, 1.4), vertices=24)
    for k in range(8):
        a = k * math.pi / 4
        rack = add("cube", "Rack", GUNMETAL(), top, size=1, location=(math.cos(a) * 1.45, math.sin(a) * 1.45, 1.2), rotation=(0, 0, a), scale=(0.3, 0.5, 2.0))
        bevel(rack, 0.03, 2)
        for j in range(5):
            add("cube", "RackLed", STATE("Core"), top, size=1, location=(math.cos(a) * 1.29, math.sin(a) * 1.29, 0.5 + j * 0.32), rotation=(0, 0, a), scale=(0.01, 0.3, 0.03))
    clip(rotor, "Idle", "rotation_euler", [(1, (0, 0, 0)), (241, (0, 0, 2 * math.pi))])
    clip(rotor, "Work", "rotation_euler", [(1, (0, 0, 0)), (25, (0, 0, 2 * math.pi))])
    return top


def build_plug():
    top = root("CablePlug")
    body = add("cylinder", "Body", GUNMETAL(), top, radius=0.07, depth=0.18, location=(0, 0, 0.09), vertices=32)
    bevel(body, 0.015, 2)
    add("torus", "PlugGlow", STATE("Plug"), top, major_radius=0.07, minor_radius=0.012, location=(0, 0, 0.16))
    add("cylinder", "Pin", CHROME(), top, radius=0.025, depth=0.08, location=(0, 0, 0.22), vertices=16)
    return top


def build_deliverable():
    top = root("Deliverable")
    shell = add("cube", "Cartridge", DARK(), top, size=1, location=(0, 0, 0.06), scale=(0.7, 0.5, 0.12))
    bevel(shell, 0.03, 3)
    add("cube", "Label", TOOL("Card"), top, size=1, location=(0, -0.252, 0.07), scale=(0.5, 0.01, 0.05))
    add("cube", "Contacts", CHROME(), top, size=1, location=(0, 0.2, 0.125), scale=(0.4, 0.06, 0.01))
    return top


def build_antenna():
    top = root("Antenna")
    stalk = root("Stalk")
    stalk.parent = top
    base = add("cylinder", "Base", CHROME(), stalk, radius=0.1, depth=0.08, location=(0, 0, 0.04), vertices=32)
    bevel(base, 0.015, 2)
    add("cylinder", "Rod", GUNMETAL(), stalk, radius=0.02, depth=0.55, location=(0, 0, 0.35), vertices=12)
    add("uv_sphere", "Tip", STATE("Tip"), stalk, radius=0.065, location=(0, 0, 0.66))
    clip(stalk, "Idle", "rotation_euler", [(1, (0, 0.08, 0)), (49, (0, -0.08, 0)), (97, (0, 0.08, 0))])
    clip(stalk, "Work", "rotation_euler", [(1, (0.15, 0.18, 0)), (8, (-0.15, -0.18, 0)), (15, (0.15, 0.18, 0))])
    clip(stalk, "Celebrate", "rotation_euler", [(1, (0, 0, 0)), (20, (0, 0.3, math.pi * 2))])
    return top


def build_drone():
    top = root("Drone")
    body = add("cube", "Body", GUNMETAL(), top, size=1, scale=(0.16, 0.16, 0.12))
    bevel(body, 0.025, 3)
    for side in (-1, 1):
        panel = add("cube", "Panel", PANEL(), top, size=1, location=(side * 0.24, 0, 0), scale=(0.28, 0.13, 0.012))
        bevel(panel, 0.006, 1)
    beacon = add("uv_sphere", "Beacon", STATE("Beacon"), top, radius=0.035, location=(0, 0, 0.08))
    clip(beacon, "Blink", "scale", [(1, (1, 1, 1)), (15, (1, 1, 1)), (20, (1.9, 1.9, 1.9)), (29, (1, 1, 1))])
    return top


def build_server():
    top = root("Server")
    chassis = add("cube", "Chassis", GUNMETAL(), top, size=1, location=(0, 0, 0.45), scale=(0.9, 0.9, 0.9))
    bevel(chassis, 0.04, 3)
    for i in range(4):
        bay = add("cube", "Bay", DARK(), top, size=1, location=(0, -0.452, 0.15 + i * 0.2), scale=(0.78, 0.02, 0.13))
        bevel(bay, 0.01, 1)
        add("cube", "Led", TOOL("Led"), top, size=1, location=(-0.1, -0.465, 0.15 + i * 0.2), scale=(0.5, 0.01, 0.025))
    return top


def build_page():
    top = root("Page")
    slab = add("cube", "Slab", DARK(), top, size=1, location=(0, 0, 0.45), scale=(0.9, 0.9, 0.9))
    bevel(slab, 0.04, 3)
    for i, z in enumerate((0.75, 0.6, 0.45, 0.3)):
        width = 0.4 if i == 3 else 0.7
        add("cube", "Line", TOOL("Text"), top, size=1, location=((width - 0.7) / 2, -0.455, z), scale=(width, 0.01, 0.04))
    return top


def build_pylon():
    top = root("Pylon")
    plinth = add("cylinder", "Plinth", DARK(), top, radius=0.85, depth=0.3, location=(0, 0, 0.15), vertices=6, smooth=False)
    bevel(plinth, 0.04, 2)
    column = add("cylinder", "Column", GUNMETAL(), top, radius=0.28, depth=4.2, location=(0, 0, 2.4), vertices=6, smooth=False)
    column.modifiers.new("Taper", "SIMPLE_DEFORM").deform_method = "TAPER"
    column.modifiers["Taper"].factor = -0.3
    bevel(column, 0.02, 2)
    sculpt(column, 0.02, 0.25)
    ring = root("HaloRing")
    ring.parent = top
    ring.location = (0, 0, 4.7)
    add("torus", "Halo", STATE("Halo"), ring, major_radius=0.55, minor_radius=0.05)
    add("uv_sphere", "Core", STATE("Core"), top, radius=0.28, location=(0, 0, 4.7))
    clip(ring, "Idle", "rotation_euler", [(1, (0, 0, 0)), (145, (math.pi, 0, math.pi * 2))])
    return top


PARTS = {
    "hal-shell": build_shell,
    "arm-shoulder": build_shoulder,
    "arm-upper": lambda: arm_segment("ArmUpper", UPPER_ARM, 0.085),
    "arm-fore": lambda: arm_segment("ArmFore", FOREARM, 0.07),
    "tool-gripper": lambda: tool("ToolGripper", gripper),
    "tool-driver": lambda: tool("ToolDriver", driver),
    "tool-pen": lambda: tool("ToolPen", pen),
    "tool-probe": lambda: tool("ToolProbe", probe),
    "tool-dish": lambda: tool("ToolDish", dish),
    "tool-splitter": lambda: tool("ToolSplitter", splitter),
    "desk": build_desk,
    "floor-panel": build_floor_panel,
    "core": build_core,
    "cable-plug": build_plug,
    "deliverable": build_deliverable,
    "antenna": build_antenna,
    "drone": build_drone,
    "server": build_server,
    "page": build_page,
    "pylon": build_pylon,
}


def export(name, coll):
    # Datablock names are unique per .blend, so a second "Idle" becomes
    # "Idle.001". Give this part's actions their clip names just for export.
    mine = {
        strip.action
        for obj in coll.all_objects
        if obj.animation_data
        for track in obj.animation_data.nla_tracks
        for strip in track.strips
        if strip.action
    }
    for i, action in enumerate(bpy.data.actions):
        action.name = f"__export_{i}"
    for action in mine:
        action.name = action.get("clip", action.name)
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for obj in coll.all_objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, f"{name}.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_extras=False,
    )
    for action in bpy.data.actions:
        action.name = f"{name}:{action.get('clip', action.name)}" if action in mine else action.name


def render_preview(name, coll, directory):
    """A quick studio render of one part, for eyeballing shapes."""
    os.makedirs(directory, exist_ok=True)
    for other in bpy.data.collections:
        other.hide_render = other is not coll
    objs = [o for o in coll.all_objects if o.type == "MESH"]
    lo = Vector((min(v[i] for o in objs for v in [o.matrix_world @ Vector(c) for c in o.bound_box]) for i in range(3)))
    hi = Vector((max(v[i] for o in objs for v in [o.matrix_world @ Vector(c) for c in o.bound_box]) for i in range(3)))
    center = (lo + hi) / 2
    size = max((hi - lo).length, 0.3)
    cam_data = bpy.data.cameras.get("PreviewCam") or bpy.data.cameras.new("PreviewCam")
    cam = bpy.data.objects.get("PreviewCam") or bpy.data.objects.new("PreviewCam", cam_data)
    if cam.name not in scene.collection.objects:
        scene.collection.objects.link(cam)
    cam.location = center + Vector((size * 0.9, -size * 1.4, size * 0.8))
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    for key, loc, energy in (("PreviewKey", (2, -3, 4), 900), ("PreviewRim", (-3, 2, 2), 500)):
        light = bpy.data.objects.get(key)
        if not light:
            light = bpy.data.objects.new(key, bpy.data.lights.new(key, "AREA"))
            scene.collection.objects.link(light)
        light.data.energy = energy * size * size
        light.data.size = size * 2
        light.location = center + Vector(loc) * size
        light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.color = (0.02, 0.025, 0.035)
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_WORKBENCH"
    scene.render.resolution_x = scene.render.resolution_y = 420
    scene.render.filepath = os.path.join(directory, f"{name}.png")
    bpy.ops.render.render(write_still=True)


os.makedirs(OUT, exist_ok=True)
collections = {}
for name, build in PARTS.items():
    collections[name] = new_collection(name)
    build()
    export(name, collections[name])
    print(f"[owl3d-kit] exported {name}.glb")

if PREVIEW:
    for name, coll in collections.items():
        render_preview(name, coll, PREVIEW)

for coll in bpy.data.collections:
    coll.hide_render = False
bpy.ops.wm.save_as_mainfile(filepath=BLEND, compress=True)
print(f"[owl3d-kit] saved {BLEND}")
