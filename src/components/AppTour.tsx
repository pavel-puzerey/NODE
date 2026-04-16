import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface AppTourProps {
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export function AppTour({ onClose, setActiveTab }: AppTourProps) {
  useEffect(() => {
    // Steps with their associated tab to switch to BEFORE showing
    const tourSteps: { tab?: string; title: string; description: string }[] = [
      {
        title: 'Welcome to NODE',
        description: 'NODE is your precision rifle logbook — equipment, loads, and sessions in one place. This tour walks you through each module. Use the buttons or arrow keys to navigate.',
      },
      {
        title: 'Navigation',
        description: 'Open the sidebar with the ☰ button in the top-left. Modules are grouped by category — Equipment, Shooting, Load Development, Maintenance, and System.',
      },
      {
        tab: 'rifles',
        title: 'Rifles',
        description: 'Log every rifle with caliber, action, barrel, chassis, trigger, and trigger weight. Round count is tracked automatically from range sessions, with a barrel life warning threshold you can set.',
      },
      {
        tab: 'glass',
        title: 'Optics',
        description: 'Track rifle scopes, spotting scopes, binoculars (with magnification × objective), and rangefinders. Upload a reticle photo for any scope and zoom in on demand.',
      },
      {
        tab: 'ammo',
        title: 'Ammo Inventory',
        description: 'Track factory ammo and handload batches with quantity on hand. Each card expands to show a full usage history drawn from your range sessions.',
      },
      {
        tab: 'gear',
        title: 'Reloading Gear',
        description: 'Inventory reloading components (bullets, powder, brass, primers) and equipment (press, dies, scale, trimmer, annealer). Lot numbers and weights are tracked per item.',
      },
      {
        tab: 'torque',
        title: 'Torque Specs',
        description: 'Record torque values for every fastener per rifle — scope rings, rail screws, action screws, chassis screws, and more.',
      },
      {
        tab: 'dope',
        title: 'DOPE',
        description: 'Build a DOPE card per rifle in MOA or MIL. Enter elevation holds at each distance from 100 to 3000 yards, with a notes field per row.',
      },
      {
        tab: 'range',
        title: 'Range Session',
        description: 'Log conditions (temp, humidity, wind, pressure, altitude), select rifle and ammo type, then add shooting groups. Upload velocity data from a Garmin or Athlon CSV — a dot plot is generated automatically.',
      },
      {
        tab: 'loads',
        title: 'Load Recipes',
        description: 'Document handloads — bullet, powder, charge, brass, primer, OAL, seating depth, and neck tension. Duplicate any recipe as a starting point for new development.',
      },
      {
        tab: 'analysis',
        title: 'Load Analysis',
        description: 'Visualize performance after selecting a rifle. Filter by session and group. Charts include Velocity Trend, Load Performance Matrix, Accuracy Node, and Velocity SD vs Charge.',
      },
      {
        tab: 'cleaning',
        title: 'Cleaning Log',
        description: 'Track cleaning sessions per rifle — date, rounds since last clean, products used, and notes.',
      },
      {
        tab: 'calendar',
        title: 'Match Calendar',
        description: 'Schedule competitions with date, time, reminders, and notes. Events are sorted chronologically so your next match is always at the top.',
      },
      {
        tab: 'settings',
        title: 'Data Management',
        description: 'Export a full JSON backup of all your data and restore it on any device. Find this under System → Data Management.',
      },
      {
        title: "You're ready",
        description: "Start by adding your rifles and gear under Equipment, then build out your load recipes and DOPE cards. Happy shooting.",
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
        const nextStep = tourSteps[currentStepIndex];
        if (nextStep?.tab) setActiveTab(nextStep.tab);
        driverObj.moveNext();
      },
      onPrevClick: () => {
        currentStepIndex = Math.max(currentStepIndex - 1, 0);
        const prevStep = tourSteps[currentStepIndex];
        if (prevStep?.tab) setActiveTab(prevStep.tab);
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

    // Inject custom styles — override driver.js defaults completely
    const style = document.createElement('style');
    style.id = 'node-tour-styles';
    style.textContent = `
      .node-tour-popover,
      .node-tour-popover * {
        box-sizing: border-box;
      }
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
      .node-tour-popover button.driver-popover-close-btn:hover {
        color: #ffffff !important;
      }
      .driver-popover-arrow { display: none !important; }
    `;
    document.head.appendChild(style);

    // Switch to first tab if it has one
    const firstStep = tourSteps[0];
    if (firstStep?.tab) setActiveTab(firstStep.tab);

    driverObj.drive();

    return () => {
      driverObj.destroy();
      document.getElementById('node-tour-styles')?.remove();
    };
  }, []);

  return null;
}
