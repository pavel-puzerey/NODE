import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface AppTourProps {
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export function AppTour({ onClose, setActiveTab }: AppTourProps) {
  useEffect(() => {
    const tourSteps: { tab?: string; title: string; description: string }[] = [
      {
        title: 'Welcome to NODE',
        description: 'NODE is your precision rifle logbook — equipment, loads, sessions, and analysis in one place. This tour walks you through each module. Use the buttons or arrow keys to navigate.',
      },
      {
        title: 'Navigation',
        description: 'Open the sidebar with the ☰ button in the top-left. Modules are grouped by category — Equipment, Shooting, Load Development, Maintenance, and System.',
      },
      {
        tab: 'rifles',
        title: 'Rifles',
        description: 'Log every rifle with caliber, action, barrel, chassis, trigger, and trigger weight. Toggle between Bolt Action and Gas-Operated — gas guns get gas system, BCG, buffer, and handguard fields. Round count is tracked automatically from range sessions with a barrel life warning threshold.',
      },
      {
        tab: 'glass',
        title: 'Optics',
        description: 'Track rifle scopes, spotting scopes, binoculars, rangefinders, red dots, and prism scopes. Upload a reticle photo for any scope — click it in the card to zoom in, or use the "Change photo" link to swap it.',
      },
      {
        tab: 'accessories',
        title: 'Accessories',
        description: 'Record bipods, suppressors, chronographs, tripods, scope rings, weather meters, and other support gear. Each type shows relevant fields — ballhead for tripods, fill type for shooting bags.',
      },
      {
        tab: 'gear',
        title: 'Reloading Gear',
        description: 'Inventory reloading components (bullets, powder, brass, primers) and equipment (press, dies, scale, trimmer, annealer, expander mandrel die). Lot numbers tracked per item.',
      },
      {
        tab: 'ammo',
        title: 'Ammo Inventory',
        description: 'Track factory ammo and handload batches with quantity on hand. Each card expands to show a full usage history drawn from your range sessions. Inventory updates automatically when sessions are logged.',
      },
      {
        tab: 'torque',
        title: 'Torque Specs',
        description: 'Record torque values for every fastener per rifle — scope rings, scope base, rail screws, chassis action screws, and more. Units selectable per entry (in-lbs, ft-lbs, Nm).',
      },
      {
        tab: 'dope',
        title: 'DOPE',
        description: 'Build a DOPE card per rifle in MOA or MIL. Add distances individually or use +100 yd increments. Each row is independently deletable. Hit Print 3×5 to generate a field-ready index card.',
      },
      {
        tab: 'range',
        title: 'Range Session',
        description: 'Log conditions (temp, humidity, wind, pressure, altitude), select rifle and ammo type (handload or factory), then add shooting groups. Upload velocity data from a Garmin or Athlon CSV for automatic dot plots with ES, SD, and mean. Groups appear as labeled cards in history.',
      },
      {
        tab: 'range',
        title: 'Target Analyzer',
        description: 'Upload a target photo to any group, then hit Analyze. Set a scale reference by clicking two known points, then click each shot hole. The analyzer computes group size, mean radius, and MOA at your specified distance. Results are burned into the exported image.',
      },
      {
        tab: 'loads',
        title: 'Load Recipes',
        description: 'Document handloads — bullet, powder, charge, brass, primer, OAL, seating depth, and neck tension. Recipes are grouped by bullet for easy navigation. Star a recipe to add it to your Favorites section. Duplicate any recipe as a starting point.',
      },
      {
        tab: 'loads',
        title: 'Brass Labeler',
        description: 'Create color-coded marking schemes to identify your brass and track firing counts. Choose Sharpie colors for the body stripe and extractor groove, plus a shape mark on the case head primer face. A live SVG schematic previews your scheme. The app auto-generates a full firing sequence — body colors cycle first, groove colors advance when body colors are exhausted.',
      },
      {
        tab: 'analysis',
        title: 'Load Analysis',
        description: 'Select a rifle, then filter which sessions and groups to include. Choose which plots to display: Velocity Trend (individual shots by charge), Shot Velocity Trace (per-shot sequence within a group), Load Performance Matrix (accuracy vs. consistency), Accuracy Node, and Velocity Consistency. Y-axis controls let you set custom min, max, and step.',
      },
      {
        tab: 'cleaning',
        title: 'Cleaning Log',
        description: 'Track cleaning sessions per rifle — date, rounds since last clean, and notes.',
      },
      {
        tab: 'calendar',
        title: 'Match Calendar',
        description: 'Schedule competitions in a monthly calendar view. Click any day to add an event, click an event to edit it. The right panel lists all events for the current month.',
      },
      {
        tab: 'settings',
        title: 'Data Management',
        description: 'Export a full JSON backup of all your data and restore it on any device. Permanently delete all data here — with multiple confirmation steps to prevent accidents.',
      },
      {
        title: "You're ready",
        description: "Start by adding your rifles and gear under Equipment, then build out your load recipes and DOPE cards. Use the Feedback button in the menu to send suggestions directly to the developer. Happy shooting.",
      },
    ];

    let currentStepIndex = 0;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0,0,0,0.8)',
      stagePadding: 0,
      allowClose: true,
      popoverClass: 'node-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Get started',
      onDestroyStarted: () => {
        driverObj.destroy();
        onClose();
      },
      onNextClick: () => {
        currentStepIndex = Math.min(currentStepIndex + 1, tourSteps.length - 1);
        const next = tourSteps[currentStepIndex];
        if (next?.tab) setActiveTab(next.tab);
        driverObj.moveNext();
      },
      onPrevClick: () => {
        currentStepIndex = Math.max(currentStepIndex - 1, 0);
        const prev = tourSteps[currentStepIndex];
        if (prev?.tab) setActiveTab(prev.tab);
        driverObj.movePrevious();
      },
      steps: tourSteps.map(s => ({
        popover: {
          title: s.title,
          description: s.description,
          side: 'over' as const,
          align: 'center' as const,
        },
      })),
    });

    const style = document.createElement('style');
    style.id = 'node-tour-styles';
    style.textContent = `
      .node-tour-popover,
      .node-tour-popover * { box-sizing: border-box; }
      .node-tour-popover {
        background: #111111 !important;
        border: 1px solid #2a2a2a !important;
        border-radius: 12px !important;
        box-shadow: 0 0 40px rgba(245,158,11,0.1) !important;
        padding: 24px !important;
        max-width: 380px !important;
        min-width: 320px !important;
      }
      .node-tour-popover .driver-popover-title {
        color: #ffffff !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        font-family: Oswald, sans-serif !important;
        letter-spacing: 0.05em !important;
        margin: 0 0 10px 0 !important;
        padding: 0 !important;
        background: none !important;
        text-shadow: none !important;
      }
      .node-tour-popover .driver-popover-description {
        color: #94a3b8 !important;
        font-size: 13px !important;
        line-height: 1.65 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
      }
      .node-tour-popover .driver-popover-progress-text {
        color: #4a4a4a !important;
        font-size: 11px !important;
        background: none !important;
      }
      .node-tour-popover .driver-popover-footer {
        margin-top: 20px !important;
        padding-top: 14px !important;
        border-top: 1px solid #222 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        background: none !important;
        gap: 8px !important;
      }
      .node-tour-popover .driver-popover-navigation-btns {
        display: flex !important;
        gap: 8px !important;
        background: none !important;
      }
      .node-tour-popover button {
        all: unset !important;
        cursor: pointer !important;
        font-family: Inter, sans-serif !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        padding: 6px 14px !important;
        border-radius: 6px !important;
        line-height: 1.4 !important;
        display: inline-flex !important;
        align-items: center !important;
        white-space: nowrap !important;
      }
      .node-tour-popover button.driver-popover-next-btn,
      .node-tour-popover button.driver-popover-done-btn {
        background: #f59e0b !important;
        color: #0a0a0a !important;
      }
      .node-tour-popover button.driver-popover-next-btn:hover,
      .node-tour-popover button.driver-popover-done-btn:hover {
        background: #d97706 !important;
      }
      .node-tour-popover button.driver-popover-prev-btn {
        background: transparent !important;
        color: #94a3b8 !important;
        border: 1px solid #333 !important;
      }
      .node-tour-popover button.driver-popover-prev-btn:hover {
        color: #ffffff !important;
        border-color: #555 !important;
      }
      .node-tour-popover button.driver-popover-close-btn {
        background: transparent !important;
        color: #4a4a4a !important;
        padding: 4px !important;
        position: absolute !important;
        top: 12px !important;
        right: 12px !important;
        border: none !important;
      }
      .node-tour-popover button.driver-popover-close-btn:hover { color: #ffffff !important; }
      .driver-popover-arrow { display: none !important; }
    `;
    document.head.appendChild(style);

    driverObj.drive();

    return () => {
      driverObj.destroy();
      document.getElementById('node-tour-styles')?.remove();
    };
  }, []);

  return null;
}
