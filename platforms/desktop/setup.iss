; @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
; NO LICENCE IS GRANTED. See LICENCE.txt.
;
; The Windows installer, made the way Carpe Diem's and Inkwell's are: built by Inno Setup on GitHub's Windows machine
; from the folder build of @@NAME@@ (dist_installed\@@NAME@@). It installs for the current user only, with no
; administrator password, into
;   %LOCALAPPDATA%\Programs\@@NAME@@
; puts @@NAME@@ in the Start menu (and on the Desktop if you tick it), and registers an uninstaller in Settings, Apps.
;
; Your library is NOT in that folder. It lives in
;   %LOCALAPPDATA%\@@DATA@@\storage
; so installing, updating and uninstalling never touch it; before each install a COPY of it is made in
;   %LOCALAPPDATA%\@@DATA@@\backups\setup-<date and time>

#ifndef AppVersion
  #define AppVersion "@@PASS@@"
#endif
#ifndef SourceDir
  #define SourceDir "..\dist_installed\@@NAME@@"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist"
#endif

[Setup]
AppId={{@@GUID@@}
AppName=@@NAME@@
AppVersion={#AppVersion}
AppVerName=@@NAME@@, build {#AppVersion}
AppPublisher=Yannie D. Forest
AppCopyright=Copyright (c) 2026 Yannie D. Forest. All rights reserved.
DefaultDirName={localappdata}\Programs\@@NAME@@
DefaultGroupName=@@NAME@@
DisableProgramGroupPage=yes
DisableDirPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=@@NAME_DASH@@-{#AppVersion}-Windows-Setup
SetupIconFile=..\@@FILE@@.ico
UninstallDisplayIcon={app}\@@NAME@@.exe
UninstallDisplayName=@@NAME@@
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=no
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\@@NAME@@"; Filename: "{app}\@@NAME@@.exe"; WorkingDir: "{app}"; Comment: "@@NAME@@, build {#AppVersion}"
Name: "{userdesktop}\@@NAME@@"; Filename: "{app}\@@NAME@@.exe"; WorkingDir: "{app}"; Comment: "@@NAME@@, build {#AppVersion}"; Tasks: desktopicon

[Run]
Filename: "{app}\@@NAME@@.exe"; Description: "{cm:LaunchProgram,@@NAME@@}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM ""@@NAME@@.exe"" /T"; Flags: runhidden; RunOnceId: "Stop@@NAME_ID@@"

[UninstallDelete]
Type: files; Name: "{app}\@@FILE@@_crash.log"

[Code]
{ Before anything changes: close a running @@NAME@@, and copy the folder that holds your library to backups. A copy
  only; nothing is moved or deleted. }
procedure CurStepChanged(CurStep: TSetupStep);
var
  Code: Integer;
  Src, Dst: String;
begin
  if CurStep = ssInstall then
  begin
    Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM "@@NAME@@.exe" /T', '', SW_HIDE, ewWaitUntilTerminated, Code);
    Src := ExpandConstant('{localappdata}\@@DATA@@\storage');
    if DirExists(Src) then
    begin
      Dst := ExpandConstant('{localappdata}\@@DATA@@\backups\setup-') + GetDateTimeString('yyyymmdd-hhnnss', #0, #0) + '\storage';
      Exec(ExpandConstant('{sys}\robocopy.exe'), '"' + Src + '" "' + Dst + '" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /XD Cache "Code Cache" GPUCache DawnCache GrShaderCache ShaderCache',
           '', SW_HIDE, ewWaitUntilTerminated, Code);
    end;
  end;
end;
