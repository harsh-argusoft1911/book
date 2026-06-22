const Settings = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-primary">Settings</h3>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and notifications</p>
      </div>
      
      <div className="rounded-2xl bg-card border border-border p-8 shadow-soft flex flex-col items-center justify-center text-center py-20 opacity-60">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
           <span className="text-2xl">⚙️</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Account settings are being optimized for your experience.</p>
        <button className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">Check for Updates</button>
      </div>
    </div>
  );
};

export default Settings;
