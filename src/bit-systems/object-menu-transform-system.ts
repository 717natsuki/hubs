import { defineQuery } from "bitecs";
import { HubsWorld } from "../app";
import { ObjectMenuTransform } from "../bit-components";
import { EntityID } from "../utils/networking-types";
import { Box3, Matrix4, Quaternion, Sphere, Vector3 } from "three";
import { getBox, setMatrixWorld } from "../utils/three-utils";

const _vec3_1 = new Vector3();
const _vec3_2 = new Vector3();
const _quat = new Quaternion();
const _mat4 = new Matrix4();
const aabb = new Box3();
const sphere = new Sphere();

function moveToTarget(world: HubsWorld, menu: EntityID) {
  const targetEid = ObjectMenuTransform.targetObjectRef[menu];
  const targetObj = world.eid2obj.get(targetEid);
  if (!targetObj) return;

  getBox(world, targetEid, targetEid, aabb, true);
  aabb.getBoundingSphere(sphere);

  // Keeps world scale (1, 1, 1) because
  // a menu object is a child of a target object
  // and the target object's scale can be changed.
  // Another option may be making the menu object
  // a sibling of the target object.
  _mat4.copy(targetObj.matrixWorld);
  _mat4.decompose(_vec3_1, _quat, _vec3_2);
  _vec3_2.set(1.0, 1.0, 1.0);
  _mat4.compose(sphere.center, _quat, _vec3_2);

  const menuObj = world.eid2obj.get(menu)!;
  setMatrixWorld(menuObj, _mat4);

  // TODO: Remove the dependency with AFRAME
  const camera = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.viewingCamera;
  camera.updateMatrices();
  menuObj.lookAt(sphere.center.setFromMatrixPosition(camera.matrixWorld));
  menuObj.translateZ(sphere.radius);
}

const menuQuery = defineQuery([ObjectMenuTransform]);

export function objectMenuTransformSystem(world: HubsWorld) {
  menuQuery(world).forEach(menu => {
    moveToTarget(world, menu);
  });
}
