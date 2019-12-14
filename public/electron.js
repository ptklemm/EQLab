const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    ipcMain
}                        = require('electron');
const WindowStateManager = require('electron-window-state-manager');
const IN_DEVELOPMENT     = require('electron-is-dev');

global.IN_DEVELOPMENT = IN_DEVELOPMENT;
global.APP_PATH       = app.getAppPath();
global.APP_NAME       = app.name;
global.APP_VERSION    = app.getVersion();

class MainProcess
{
    constructor()
    {
        this.DIMENSIONS = { width: 1000, height: 800, minWidth: 400, minHeight: 300 };

        this.main_window               = null;
        this.main_window_state_manager = null;
        this.main_menu                 = null;
    }

    Start()
    {
        app.on('ready', () => {
            this.CreateMainWindow();
            this.Listen();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') { app.quit(); }
        });

        app.on('activate', () => {
            if (this.main_window === null) { this.CreateMainWindow(); }
        });

        app.on('quit', () => {
            process.exit(); // Leave the npm script
        });
    }

    Listen()
    {
      
    }

    CreateMainWindow()
    {
        this.main_window_state_manager = new WindowStateManager("main", {
            defaultWidth:  this.DIMENSIONS.width,
            defaultHeight: this.DIMENSIONS.height
        });
    
        this.main_window = new BrowserWindow({
            show:                   false,
            frame:                  true,
            title:                  global.APP_NAME,
            autoHideMenuBar:        false,
            backgroundColor:        "#FFFFFF",
            minWidth:               this.DIMENSIONS.minWidth,
            minHeight:              this.DIMENSIONS.minHeight,
            width:                  this.main_window_state_manager.width,
            height:                 this.main_window_state_manager.height,
            resizable:              true,
            center:                 true,
            movable:                true,
            maximized:              true,
            maximizable:            true,
            minimizable:            true,
            closable:               true,
            focusable:              true,
            alwaysOnTop:            false,
            fullscreen:             false,
            fullscreenable:         false,
            skipTaskbar:            false,
            kiosk:                  false,
            webPreferences: {
                devTools:           true,
                nodeIntegration:    true,
                enableRemoteModule: true
            }
        });

        const main_menu_template = [
            {
                role: 'editMenu'
            }
        ];
    
        this.main_menu = Menu.buildFromTemplate(main_menu_template);
        
        if (IN_DEVELOPMENT)
        {
            this.main_menu.append(new MenuItem({
                id: 'debug',
                label: 'Debug',
                submenu: [{
                        role: 'reload'
                    },
                    {
                        role: 'forceReload'
                    },
                    {
                        role: 'toggleDevTools'
                    }
                ]
            }));
        }
    
        this.main_window.setMenu(this.main_menu);

        if (this.main_window_state_manager.maximized)
        {
            this.main_window.maximize();
        }
    
        this.main_window.on('close',  () => this.main_window_state_manager.saveState(this.main_window));
        this.main_window.on('move',   () => this.main_window_state_manager.saveState(this.main_window));
        this.main_window.on('resize', () => this.main_window_state_manager.saveState(this.main_window));

        this.main_window.loadURL(
            IN_DEVELOPMENT
                ? 'http://localhost:3000#/main'
                : `file://${__dirname}/index.html#/main`
        );

        if (IN_DEVELOPMENT)
        {
            this.main_window.webContents.openDevTools();
        }

        this.main_window.once('ready-to-show', () => {
            this.main_window.show();
        });
    
        this.main_window.on('closed', () => {
            this.main_window = null;
            this.main_menu   = null;
        });
    }
}

(() => {
    const main_process = new MainProcess();

    main_process.Start();
})();
