function bubble = csv2matlab( clickfile, outfile, descfile)
%CSV2MATLAB Summary of this function goes here
%   e.g., csv2matlab('./preprop/click24_nov.csv',
% './datasets/bubble24_nov.mat', './preprop/desc24_nov.csv')
%   outliers were removed in the previous stage. 
parseDesc = true;
if nargin<3
    parseDesc = false;
end    
%read click data %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
disp('read click data')
fid = fopen(clickfile);
out = textscan(fid,'%s%s%s%f%f','delimiter',',');
fclose(fid);


% reshape
len = size(out{1},1);

data = containers.Map();
for i=1:len
    time    = out{1}(i);
    img     = char(out{2}(i));
    user    = char(out{3}(i));
    x       = out{4}(i);
    y       = out{5}(i);
    
    if isKey(data, img)==0
        data(img) = containers.Map();
    end
    userdata = data(img);
    if isKey(userdata, user)==0
        userdata(user) = [];
    end
    userdata(user) = [userdata(user);[x,y,time]];  %% order correct? y,x?
end

% read desc data %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
disp('read desc data')

ddata = containers.Map();
if parseDesc

    fid = fopen(descfile);
    out = textscan(fid,'%q%q%q%d%q%q','delimiter',',');
    fclose(fid);
    % reshape
    len = size(out{1},1);

    ddata = containers.Map();
    for i=1:len
        time    = char(out{1}(i));
        img     = char(out{2}(i));
        user    = char(out{3}(i));
        gID     = out{4}(i);
        type    = char(out{5}(i));
        text    = char(out{6}(i));
        
        if isKey(ddata, img)==0
            ddata(img) = containers.Map();
        end
        userdata = ddata(img);
        if isKey(userdata, user)==0
            userdata(user) = [];
        end
        if isempty(text)
            text = ' ';
        end
        s = struct('order', gID, 'type', type, 'text',text, 'time', time);
        userdata(user) = [userdata(user);s];  %% order correct? y,x?
    end
end
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% reformat into matlab format (image->worker->click)
bubble = [];

imgCnt = size(data,1);
imgNames = keys(data);
for i=1:imgCnt
    img = char(imgNames(i));%image filename
    
    % set filenames
    s = struct('filename', img, 'impath', strcat('targets/',img), 'userdata',[]);
    
    % set click data
    userdata = data(img);
    userCnt  = size(userdata,1);
    userNames= keys(userdata);
    
    % load image for boundary check
    im = imread(s.impath);
    
    clicks = [];
    for j=1:userCnt
        user = char(userNames(j));
        u = struct('fixations', struct('enc', [], 'rec', [], 'enc_time', []));
        clickData = userdata(user);
        
        u.fixations.enc = cell2mat(clickData(:,1:2));
        u.fixations.enc_time = clickData(:,3);
        
        % filter clicks outside image boundary
        valid = [];
        for jj = 1:size(u.fixations.enc,1)
            curfix =  u.fixations.enc(jj,:);
            if curfix(1) > 0 && curfix(1) < size(im,2) && ...
                    curfix(2) > 0 && curfix(2) < size(im,1)
                valid = [valid,jj];
            end
        end
        
        %fprintf('File %d, user %d, keeping %d/%d fixations\n',...
        %    i,j,length(valid),size(u.fixations.enc,1));
        u.fixations.enc = u.fixations.enc(valid,:);
        u.fixations.enc_time = u.fixations.enc_time(valid,:);
        
        %temporary code to match the number of fixations
%         if length(u.fixations.enc)>90
%             u.fixations.enc = u.fixations.enc(1:90, :);
%         end
        
        % filter if #ofclicks is too low (parameter chosen emperically
        clickCount  = length(clickData);
        if clickCount<=10
            continue
        end
        
        
        
        %collect click counts
        clicks = [clicks; length(clickData)];
        
        % add desc data %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        if parseDesc
            descUserData = ddata(img);
            
            u.descriptions = descUserData(user);
            %[u.descriptions] = deal(struct('order', [], 'type', [], 'text', [], 'groupTime', []));
%             u.descriptions.order = descData(:).order %descData(:,1);
%             u.descriptions.type = descData(:).type; %descData(:,2);
%             u.descriptions.text = descData(:).text; %descData(:,3);
%             u.descriptions.groupTime = descData(:).time; %descData(:,4);
            
        end
        
        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        
        s.userdata = [s.userdata, u];
    end

        
    bubble = [bubble; s];
end
bubble = bubble';

save(outfile, 'bubble');
fprintf('Click data saved into %s\n', outfile);
end
