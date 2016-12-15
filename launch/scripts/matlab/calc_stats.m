function calc_stats(bubble)

    nfiles = length(bubble);
    
    allClicks = [];
    allTimes  = [];
    groups    = [];
    for i = 1:nfiles
        % Clicks
        clicksPerImage = []; 
        for j = 1:length(bubble(i).userdata)
            clicksPerUser = length(bubble(i).userdata(j).fixations.enc);
            clicksPerImage = [clicksPerImage; clicksPerUser];
            groups    = [groups; i];
        end
        
        fprintf('Count = Image %d (Avg: %.2f, Median: %.2f, Max=%.2f, Min=%.2f, SD=%.2f)\n',i, ...
            mean(clicksPerImage), median(clicksPerImage),...
            max(clicksPerImage), min(clicksPerImage), std(clicksPerImage));
        allClicks = [allClicks; clicksPerImage];
        
        % Timespan
        timesPerImage = []; 
        for j = 1:length(bubble(i).userdata)
            dates = sort(bubble(i).userdata(j).fixations.enc_time);
            elapsed = etime(datevec(dates(end)),datevec(dates(1)));
            timesPerImage = [timesPerImage; elapsed/60];        
        end
        
        fprintf('Time = Image %d (Avg: %.2f, Median: %.2f, Max=%.2f, Min=%.2f, SD=%.2f)\n\n',i, ...
            mean(timesPerImage), median(timesPerImage), ...
            max(timesPerImage), min(timesPerImage), std(timesPerImage));
        allTimes = [allTimes; timesPerImage];        
    end
    fprintf('Total.Avg.Click: %.2f, Total.Med.Click: %.2f, (SD=%.2f)\n',...
        mean(allClicks), median(allClicks), std(allClicks));
    fprintf('Total.Avg.Time: %.2f, Total.Med.Time: %.2f, (SD=%.2f)\n',...
        mean(allTimes), median(allTimes), std(allTimes));
    
    figure(1), boxplot(allClicks,groups);
    figure(2), boxplot(allTimes,groups);
    fprintf('click vs time correlation = %.2f\n', CC(allClicks, allTimes));
    
end