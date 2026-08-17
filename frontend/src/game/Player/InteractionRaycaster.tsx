import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { interactionManager } from '../../stores/interactionStore';
import { soundEngine } from '../../services/soundEngine';

export const InteractionRaycaster: React.FC = () => {
  const { camera, scene } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const centerScreen = useRef(new THREE.Vector2(0, 0));

  // Limit raycast distance to comfortable first-person interaction range
  useEffect(() => {
    raycasterRef.current.far = 4.2;
  }, []);

  // Raycast from camera center on every frame
  useFrame(() => {
    // If a modal is open, don't raycast
    if (interactionManager.getActiveModal()) {
      interactionManager.setTargeted(null);
      return;
    }

    raycasterRef.current.setFromCamera(centerScreen.current, camera);
    const intersects = raycasterRef.current.intersectObjects(scene.children, true);

    let foundInteractable: any = null;

    for (let i = 0; i < intersects.length; i++) {
      const hit = intersects[i];
      let curr: THREE.Object3D | null = hit.object;

      while (curr) {
        if (curr.userData && curr.userData.isInteractable && curr.userData.interactableId) {
          foundInteractable = curr.userData.interactableId;
          break;
        }
        curr = curr.parent;
      }

      if (foundInteractable) break;
    }

    if (foundInteractable) {
      const obj = interactionManager.getObject(foundInteractable);
      if (obj) {
        interactionManager.setTargeted(obj);
      }
    } else {
      interactionManager.setTargeted(null);
    }
  });

  // Handle 'E' key press to interact
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        const targeted = interactionManager.getTargeted();
        const activeModal = interactionManager.getActiveModal();

        if (targeted && !activeModal) {
          e.preventDefault();
          soundEngine.playKeyTick();
          interactionManager.openModal(targeted);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};

export default InteractionRaycaster;
