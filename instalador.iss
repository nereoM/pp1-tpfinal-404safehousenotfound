[Setup]
AppName=SafeHouseApp
AppVersion=1.0
DefaultDirName={pf}\SafeHouseApp
DefaultGroupName=SafeHouseApp
OutputDir=.
OutputBaseFilename=InstaladorSafeHouseApp
Compression=lzma
SolidCompression=yes

[Files]
Source: "server\dist\main.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "server\.env"; DestDir: "{app}"; Flags: ignoreversion
Source: "client\dist\*"; DestDir: "{app}\client\dist"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\SafeHouseApp"; Filename: "{app}\main.exe"

[Run]
Filename: "{app}\main.exe"; Description: "Iniciar aplicación"; Flags: nowait postinstall skipifsilent