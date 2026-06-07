export interface Vector {
  id: string;
  label: string;
  short: string;
  sub: string;
  icon: string;
}

export const VECTORS: Vector[] = [
  { id: 'removable', label: 'Removable Media', short: 'USB/CDROM', sub: 'USB drives, CDROM, DVD', icon: '💾' },
  { id: 'printing', label: 'Printing', short: 'Printing', sub: 'Physical print output', icon: '🖨️' },
  { id: 'clipboard', label: 'Copy/Paste', short: 'Copy/Paste', sub: 'Clipboard exfiltration', icon: '📋' },
  { id: 'bluetooth', label: 'Bluetooth', short: 'Bluetooth', sub: 'Wireless Bluetooth transfer', icon: '📡' },
  { id: 'email_net', label: 'Email (Network Detect)', short: 'Email-Net', sub: 'Email detection at network layer', icon: '✉️' },
  { id: 'email_ep', label: 'Email (Endpoint Detect)', short: 'Email-EP', sub: 'Email detection at endpoint', icon: '📧' },
  { id: 'proxy', label: 'Proxy (Network Detect)', short: 'Proxy', sub: 'Web proxy / network egress', icon: '🌐' },
  { id: 'webupload', label: 'Web Upload (HTTP/S Endpoint)', short: 'Web Upload', sub: 'HTTP/HTTPS upload at endpoint', icon: '⬆️' },
  { id: 'fileshare', label: 'File Sharing', short: 'File Share', sub: 'SMB, SSH, SFTP, FTP, RDP, OneDrive', icon: '📁' },
  { id: 'cloudexfil', label: 'Cloud Exfiltration', short: 'Cloud Exfil', sub: 'SaaS uploads, shadow IT, CASB', icon: '☁️' },
];
